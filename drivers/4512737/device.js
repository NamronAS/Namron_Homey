'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { getInt16 } = require('../../lib/SrUtils')
const SrThermostatCluster = require('../../lib/SrThermostatCluster')

Cluster.addCluster(SrThermostatCluster)

class ZigBeeThermostat extends ZigBeeDevice {

  controlTypeValue = 'room'

  isNotAwayValue = true
  roomTemperatureValue = null
  floorTemperatureValue = null

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit ({
    zclNode, node,
  }) {
    super.onNodeInit(
      { zclNode, node })

    this.log('the device is initialized.')

    this.enableDebug()
    this.printNode()

    this._listenTargetTemperatureReport()
    this._listenOnOff()

    this._registerAwayMode()

    this.controlTypeValue = await this.zclNode.endpoints[1].clusters.thermostat.readAttributes(
      'controlType').catch(this.error)
    this._registerControlType()

    this._registerRoomSensor()
    this._registerFloorSensor()

    this._registerTargetTemperatureListener()

    this._registerThermostatMode()

    this._refreshTargetTemperatureByIsNotAway()

    this.registerMeterPowerMeasurePower().then(r => {})
  }

  async onSettings ({ oldSettings, newSettings, changedKeys }) {

    let payload = {}
    if (newSettings.hasOwnProperty('hysteresis')) {
      let newHysteresis = Math.round(newSettings['hysteresis'] * 10.0)
      this.log(`new hysteresis`, newHysteresis)
      payload['hysteresis'] = newHysteresis
    }

    if (payload === {}) {
      return
    }

    await this._thermostatCluster().writeAttributes(payload).catch(this.error)
  }

  _registerTargetTemperatureListener () {

    this.registerCapabilityListener('target_temperature',
      async (value, opts) => {

        return this._readIsNotAwayModeAttribute().then(isNotAway => {

          let payload = {}
          if (isNotAway) {
            payload = {
              occupiedHeatingSetpoint: value * 100,
            }
          } else {
            payload = {
              unoccupiedHeatingSetpoint: value * 100,
            }
          }

          return this._thermostatCluster().writeAttributes(payload).catch(this.error)
        })
      })
  }

  _registerThermostatMode () {

    this.registerCapability('my_thermostat_mode', CLUSTER.THERMOSTAT, {
      get: 'systemMode',
      getOpts: {
        getOnStart: true,
        pollInterval: 60 * 60 * 1000,
      },
      report: 'systemMode',
      reportParser (value) {

        this.log('systemMode report ')
        this.log(value)

        if (this.isNotAwayValue) {

          this._refreshTargetTemperature(true)

          this.setCapabilityValue('onoff', !(value === 'off')).catch(this.error)

        } else {

          this.setCapabilityValue('onoff', true).catch(this.error)
        }

        return value
      },
    })

    this.registerCapabilityListener('my_thermostat_mode', async value => {

      this.log('systemMode set')
      this.log(value)

      this.isNotAwayValue = true
      return this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({
        systemMode: value,
      }).catch(this.error)
    })
  }

  _registerAwayMode () {

    this.registerCapability('my_thermostat_away_mode', CLUSTER.THERMOSTAT, {
      get: 'occupancy',
      getOpts: {
        getOnStart: true,
        pollInterval: 60 * 60 * 1000,
      },
      report: 'occupancy',
      reportParser (value) {

        const isNotAway = value['occupied']

        this.log('occupancy report ')
        this.log(isNotAway)

        this.isNotAwayValue = isNotAway
        this._refreshTargetTemperature(isNotAway)

        return !isNotAway
      },
    })
  }

  _registerControlType () {

    this.registerCapability('my_thermostat_control_type', CLUSTER.THERMOSTAT, {
      get: 'controlType',
      getOpts: {
        getOnStart: true,
        pollInterval: 60 * 60 * 1000,
      },
      report: 'controlType',
      reportParser (value) {

        this.log(`controlType report `, value)

        // let type = 'room'
        //
        // if (value === 'other') {
        //
        //   type = 'roomFloor'
        //
        // } else if (value === 'roomFloor') {
        //
        //   type = 'floor'
        // }

        this.controlTypeValue = value
        this._updateMeasureTemperatureIfNeeded()
        return value
      },
    })

  }

  _registerRoomSensor () {

    this.registerCapability('my_thermostat_room_sensor', CLUSTER.THERMOSTAT, {
      get: 'localTemperature',
      getOpts: {
        getOnStart: true,
        pollInterval: 60 * 60 * 1000,
      },
      report: 'localTemperature',
      reportParser (value) {
        let temp = parseFloat((getInt16(value) / 100).toFixed(1))
        this.roomTemperatureValue = temp
        this._updateMeasureTemperatureIfNeeded()
        return temp
      },
    })

    this.getClusterCapabilityValue('my_thermostat_room_sensor',
      CLUSTER.THERMOSTAT).catch(this.error)
  }

  _registerFloorSensor () {

    this.registerCapability('my_thermostat_floor_sensor', CLUSTER.THERMOSTAT, {
      get: 'outdoorTemperature',
      getOpts: {
        getOnStart: true,
        pollInterval: 60 * 60 * 1000,
      },
      report: 'outdoorTemperature',
      reportParser (value) {

        let temp = parseFloat((getInt16(value) / 100).toFixed(1))
        this.floorTemperatureValue = temp
        this._updateMeasureTemperatureIfNeeded()
        return temp
      },
    })

    this.getClusterCapabilityValue('my_thermostat_floor_sensor',
      CLUSTER.THERMOSTAT).catch(this.error)
  }

  _updateMeasureTemperatureIfNeeded () {

    this.log('_updateMeasureTemperatureIfNeeded')
    this.log(this.controlTypeValue)

    if (this.controlTypeValue === 'room') {

      if (typeof this.roomTemperatureValue === 'number') {

        this.log('set to room temp')
        this.setCapabilityValue('measure_temperature',
          this.roomTemperatureValue).catch(this.error)
      }

    } else if (this.controlTypeValue === 'floor') {

      if (typeof this.floorTemperatureValue === 'number') {

        this.log('set to floor temp')
        this.setCapabilityValue('measure_temperature',
          this.floorTemperatureValue).catch(this.error)
      }

    } else if (this.controlTypeValue === 'roomFloor') {

      let roomTemp = 100
      let floorTemp = 100
      if (typeof this.roomTemperatureValue === 'number') {
        roomTemp = this.roomTemperatureValue
      }
      if (typeof this.floorTemperatureValue === 'number') {
        floorTemp = this.floorTemperatureValue
      }

      this.log('set to min room floor temp')
      let temp = Math.min(roomTemp, floorTemp)
      this.setCapabilityValue('measure_temperature', temp).catch(this.error)
    }
  }

  _refreshTargetTemperatureByIsNotAway () {

    this.log(`_updateTargetTemperatureIfNeeded`)

    this._readIsNotAwayModeAttribute().then(isNotAway => {

      this._refreshTargetTemperature(isNotAway)
    }).catch(this.error)
  }

  _refreshTargetTemperature (isNotAway) {

    const attribute = isNotAway
      ? 'occupiedHeatingSetpoint'
      : 'unoccupiedHeatingSetpoint'

    this._thermostatCluster().
      readAttributes(attribute).
      then(value => {

        const temp = parseFloat(
          (value[attribute] / 100).toFixed(1))
        this.log(attribute, temp)
        this.setCapabilityValue('target_temperature', temp).catch(this.error)
      }).catch(this.error)
  }

  _thermostatCluster () {

    return this.zclNode.endpoints[1].clusters.thermostat
  }

  _readIsNotAwayModeAttribute () {

    return new Promise((resolve, reject) => {

      this._thermostatCluster().readAttributes('occupancy').then(value => {

        const isNotAwayMode = value['occupancy']['occupied']
        this.log(`read occupancy in update target `, value, isNotAwayMode)
        resolve(isNotAwayMode)

      }).catch(err => {

        reject(err)
      })
    })
  }

  _listenTargetTemperatureReport () {

    this._thermostatCluster().on('attr.occupiedHeatingSetpoint', value => {

      this.log(`attr.occupiedHeatingSetpoint ${value}`)

      let temp = parseFloat((getInt16(value) / 100).toFixed(1))
      this.setCapabilityValue('target_temperature',
        temp).catch(this.error)
    })

    this._thermostatCluster().on('attr.unoccupiedHeatingSetpoint', value => {

      this.log(`attr.unoccupiedHeatingSetpoint ${value}`)

      let temp = parseFloat((getInt16(value) / 100).toFixed(1))
      this.setCapabilityValue('target_temperature',
        temp).catch(this.error)
    })
  }

  _listenOnOff () {

    this.registerCapabilityListener('onoff', async isOn => {

      return this._thermostatCluster().writeAttributes({
        systemMode: isOn ? 'heat' : 'off',
      }).catch(this.error)
    })
  }

  async registerMeterPowerMeasurePower () {

    if (this.hasCapability('meter_power')) {

      const {
        multiplier,
        divisor,
      } = await this.zclNode.endpoints[this.getClusterEndpoint(
        CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
        'multiplier', 'divisor')
      // this.log('multiplier ' + multiplier + ", divisor " + divisor)
      let meterFactory = 0.1
      if (multiplier > 0 && divisor > 0) {
        meterFactory = multiplier / divisor
      }

      this.registerCapability('meter_power', CLUSTER.METERING, {
        get: 'currentSummationDelivered',
        report: 'currentSummationDelivered',
        reportParser: value => value * meterFactory,
        getOpts: {
          getOnStart: true,
          pollInterval: 60 * 60 * 1000,
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 0,
            maxInterval: 3600,
            minChange: 0.2 / meterFactory,
          },
        },
      })
    }

    if (this.hasCapability('measure_power')) {

      /*
      const {
        acPowerMultiplier,
        acPowerDivisor,
      } = await this.zclNode.endpoints[this.getClusterEndpoint(
        CLUSTER.ELECTRICAL_MEASUREMENT)].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
        'acPowerMultiplier', 'acPowerDivisor')
      // this.log('acPowerMultiplier ' + acPowerMultiplier + ", acPowerDivisor " + acPowerDivisor)
      let measureFactory = 0.1
      if (acPowerMultiplier > 0 && acPowerDivisor > 0) {
        measureFactory = acPowerMultiplier / acPowerDivisor
      }

      this.log(`acpower `, measureFactory, acPowerMultiplier, acPowerDivisor)
       */

      this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
        get: 'activePower',
        report: 'activePower',
        reportParser: value => {
          return value
        },
        getOpts: {
          getOnStart: true,
          pollInterval: 60 * 60 * 1000,
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 0, // Minimally once every 5 seconds
            maxInterval: 3600, // Maximally once every ~16 hours
            minChange: 0.5,
          },
        },
      })
    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded () {
    this.log('MyDevice has been added')
  }

}

module.exports = ZigBeeThermostat
