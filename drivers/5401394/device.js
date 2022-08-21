'use strict'

const Homey = require('homey')
const moment = require('moment-timezone')
const DateTime = require('silly-datetime')
const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { getInt16 } = require('../../lib/SrUtils')
const SrTimeCluster = require('../../lib/SrTimeCluster')
const SrThermostatCluster = require('../../lib/SrThermostatCluster')
const SrThermostatBoundCluster = require('../../lib/SrThermostatBoundCluster')
const SrThermostatUserInterfaceConfigurationCluster = require(
  '../../lib/SrThermostatUserInterfaceConfigurationCluster')

Cluster.addCluster(SrTimeCluster)
Cluster.addCluster(SrThermostatCluster)
Cluster.addCluster(SrThermostatUserInterfaceConfigurationCluster)

const timeDiffSeconds = 946684800

class ZG9093ADevice extends ZigBeeDevice {

  onNodeInit ({ zclNode, node }) {
    super.onNodeInit({ zclNode: zclNode, node: node })

    this.enableDebug()
    this.printNode()

    this._setUpSystemCapabilities().catch(this.error)
    this._setUpMeasureTemperatureCapability()
    this._setUpTargetTemperatureCapability()
    this._setUpModesCapability()

    this._setUpWindowOpenFlagCapability()
    this._setUpInternalHeatOverCapability()
    this._setUpDateTimeCapability()

    this._setTime()
    this._getTime()

    this._getAttributes()
  }

  async onSettings ({ oldSettings, newSettings, changedKeys }) {

    this.log(`onSettings newSettings & changedKeys`, newSettings, changedKeys)

    if (changedKeys.indexOf('repeat') >= 0 ||
      changedKeys.indexOf('first_hour') >= 0 ||
      changedKeys.indexOf('first_minute') >= 0 ||
      changedKeys.indexOf('first_target') >= 0 ||
      changedKeys.indexOf('second_hour') >= 0 ||
      changedKeys.indexOf('second_minute') >= 0 ||
      changedKeys.indexOf('second_target') >= 0 ||
      changedKeys.indexOf('third_hour') >= 0 ||
      changedKeys.indexOf('third_minute') >= 0 ||
      changedKeys.indexOf('third_target') >= 0 ||
      changedKeys.indexOf('fourth_hour') >= 0 ||
      changedKeys.indexOf('fourth_minute') >= 0 ||
      changedKeys.indexOf('fourth_target') >= 0) {

      this._setTime()
      this._setWeeklySchedule(newSettings)

    } else {

      if (changedKeys.indexOf('syncTimeOnDevice') >= 0) {
        this._setTime()
      }
    }

    this._setDeviceSettings(newSettings, changedKeys)
    this._setThermostatUIConfiguration(newSettings, changedKeys)

    // Set syncTimeOnDevice to false after setTime
    this.homey.setTimeout(() => {

      this.setSettings({
        syncTimeOnDevice: false,
      })
    }, 2000)
  }

  _thermostatCluster () { return this.zclNode.endpoints[1].clusters.thermostat }

  _thermostatUserInterfaceConfiguration () {
    return this.zclNode.endpoints[1].clusters.thermostatUserInterfaceConfiguration
  }

  _timeCluster () { return this.zclNode.endpoints[1].clusters.time }

  async _setUpSystemCapabilities () {

    // onoff
    this.registerCapabilityListener('onoff', async isOn => {

      return this._thermostatCluster().writeAttributes({
        systemMode: isOn ? 'heat' : 'off',
      }).catch(this.error)
    })

    // meter_power
    if (this.hasCapability('meter_power')) {

      const {
        divisor,
      } = await this.zclNode.endpoints[this.getClusterEndpoint(
        CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
        'multiplier', 'divisor')
      this.log('divisor ' + divisor)

      this.registerCapability('meter_power', CLUSTER.METERING, {
        get: 'currentSummationDelivered',
        report: 'currentSummationDelivered',
        reportParser: value => {

          this.log(`currentSummationDelivered `, value)
          return value / divisor
        },
        getOpts: {
          getOnStart: true, pollInterval: 60 * 60 * 1000, // ms
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 10, // Minimally once every 5 minutes, second
            maxInterval: 60000, // Maximally once every ~16 hours
            minChange: 10,
          },
        },
      })
    }

    // measure_power
    if (this.hasCapability('measure_power')) {

      this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
        get: 'activePower', report: 'activePower', reportParser: value => {

          return value / 10
        }, getOpts: {
          getOnStart: true, pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
        }, reportOpts: {
          configureAttributeReporting: {
            minInterval: 10, // Minimally once every 5 seconds
            maxInterval: 60000, // Maximally once every ~16 hours
            minChange: 10,
          },
        },
      })
    }

  }

  _setUpThermostatBoundCluster () {

    this.zclNode.endpoints[1].bind(CLUSTER.THERMOSTAT.NAME,
      new SrThermostatBoundCluster({
        onGetWeeklyScheduleResponse: payload => {
          this.log(`_onGetWeeklyScheduleResponse payload `, payload)
        }, endpoint: 1,
      }))
  }

  _setUpMeasureTemperatureCapability () {

    this.registerCapability('measure_temperature', CLUSTER.THERMOSTAT, {
      get: 'localTemperature',
      report: 'localTemperature',
      reportParser: value => {

        let temp = parseFloat((getInt16(value) / 100).toFixed(1))
        this.log(`localTemperature report `, value)
        return temp
      },
      getOpts: {
        getOnStart: true, pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 10, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 50,
        },
      },
    })
  }

  _setUpTargetTemperatureCapability () {

    this.registerCapability('target_temperature', CLUSTER.THERMOSTAT, {
      get: 'occupiedHeatingSetpoint',
      report: 'occupiedHeatingSetpoint',
      reportParser: value => {

        if (this.getCapabilityValue('zg9030a_modes') === 'off') {

          this._thermostatCluster().
            readAttributes('systemMode').
            then(value => {

              let mode = value.systemMode
              let isOn = mode !== 'off'
              this.setCapabilityValue('onoff', isOn).catch(this.error)
              this.setCapabilityValue('zg9030a_modes', mode).catch(this.error)

              this.log(`systemMode after occupiedHeatingSetpoint `, value, mode,
                isOn)
            }).
            catch(this.error)
        }

        let temp = parseFloat((getInt16(value) / 100).toFixed(1))
        this.log(`occupiedHeatingSetpoint report `, value)
        return temp
      },
      getOpts: {
        getOnStart: true, pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 10, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 100,
        },
      },
    })

    this.registerCapabilityListener('target_temperature', async value => {

      this.log(`occupiedHeatingSetpoint setParser `, value)
      let payload = {
        occupiedHeatingSetpoint: value * 100,
      }
      return this._thermostatCluster().writeAttributes(payload).catch(this.error)
    })
  }

  _setUpWindowOpenFlagCapability () {

    this.registerCapability('zg9030a_window_open_flag', CLUSTER.THERMOSTAT, {
      get: 'windowOpenFlag', report: 'windowOpenFlag', reportParser: value => {

        this.log(`windowOpenFlag report `, value, value === 'opened')
        return value === 'opened' ? 'Opened' : 'Closed'
      }, getOpts: {
        getOnStart: true, pollInterval: 60 * 60 * 1000, // unit ms, 60 minutes
        getOnOnline: true,
      },
    })
  }

  _setUpInternalHeatOverCapability () {

    this.registerCapability('zg9030a_internal_over_heat', CLUSTER.THERMOSTAT, {
      get: 'internalOverHeat',
      report: 'internalOverHeat',
      reportParser: value => {

        this.log(`internalOverHeat report `, value)
        if (value === 'none') return 'None'
        if (value === 'level1') return '> 85℃ & < 90℃'
        if (value === 'level2') return '≥ 90℃'
        return null
      },
      getOpts: {
        getOnStart: true, pollInterval: 60 * 60 * 1000, // unit ms, 60 minutes
        getOnOnline: true,
      },
    })
  }

  _setUpDateTimeCapability () {

    this.registerCapability('zg9030a_datetime', CLUSTER.TIME, {
      get: 'time', report: 'time', reportParser: value => {

        const date = new Date((value + timeDiffSeconds) * 1000)
        const dateString = DateTime.format(new Date(date), 'YYYY-MM-DD HH')
        this.log(`datetime report `, value, date, dateString)
        return dateString
      }, getOpts: {
        getOnStart: true, pollInterval: 30 * 60 * 1000, // unit ms, 30 minutes
        getOnOnline: true,
      },
    })
  }

  _setDateTimeByDate (date) {

    const dateString = DateTime.format(date, 'YYYY-MM-DD HH')
    this.log(`set datetime by value `, dateString)
    this.setCapabilityValue('zg9030a_datetime', dateString).catch(this.error)
  }

  _setUpModesCapability () {

    this.registerCapability('zg9030a_modes', CLUSTER.THERMOSTAT, {
      get: 'systemMode',
      getOpts: {
        getOnStart: true, getOnOnline: true, pollInterval: 60 * 60 * 1000, // unit ms, 5 minutes
      },
      report: 'systemMode',
      reportParser: value => {

        // Refresh onoff
        let isOn = value != 'off'
        this.setCapabilityValue('onoff', isOn).catch(this.error)

        if (isOn === false) {

          this.setCapabilityValue('target_temperature', 5)

        } else {

          // Refresh heating setpoint
          this._thermostatCluster().
            readAttributes('occupiedHeatingSetpoint').
            then(value => {

              this.log(`occupiedHeatingSetpoint after mode `, value)
              const temp = parseFloat(
                (value['occupiedHeatingSetpoint'] / 100).toFixed(1))
              return this.setCapabilityValue('target_temperature', temp)
            }).
            catch(this.error)
        }

        this.log(`systemMode report `, value)
        return value
      },
    })

    this.registerCapabilityListener('zg9030a_modes', async value => {

      this.log(`systemMode set `, value)
      let payload = {
        systemMode: value,
      }
      return this._thermostatCluster().writeAttributes(payload).catch(this.error)
    })
  }

  _setTime () {

    const timezone = this.homey.clock.getTimezone()
    const date1970Milliseconds = Date.now() + moment.tz(timezone).utcOffset() *
      60 * 1000
    const date2000Seconds = Math.floor(
      date1970Milliseconds / 1000 - timeDiffSeconds)
    let date = new Date((date2000Seconds + timeDiffSeconds) * 1000)
    this.log(`will set time `, date)
    this._timeCluster().writeAttributes({

      time: date2000Seconds,

    }).then(() => {

      this.log(`set time success`)
      this._setDateTimeByDate(date)

    }).catch(err => {

      this.log(`set time error `, err)
    })

  }

  _getTime () {

    this._timeCluster().readAttributes('time').then(value => {
      let date = new Date((value.time + timeDiffSeconds) * 1000)
      this.log(`get time `, value, date)
      this._setDateTimeByDate(date)
    }).catch(err => {
      this.log(`get time error`)
    })
  }

  _getWeeklySchedule () {

    let payload = {
      daysToReturn: ['fri'], modeToReturn: ['heat'],
    }

    this._thermostatCluster().getWeeklySchedule(payload).then(value => {
      this.log(`getWeeklySchedule success, `, value)
    }).catch(this.error)
  }

  _setWeeklySchedule (settings) {

    let dayOfWeek = this._getDayOfWeekWithSettings(settings)

    const payload = {
      numberOfTransition: 'four',
      dayOfWeek: dayOfWeek,
      mode: ['heat'],
      transitionTime1: this._getTransitionTimeWithSettings(settings, 'first'),
      heatSet1: this._getHeatSetWithSettings(settings, 'first'),
      transitionTime2: this._getTransitionTimeWithSettings(settings, 'second'),
      heatSet2: this._getHeatSetWithSettings(settings, 'second'),
      transitionTime3: this._getTransitionTimeWithSettings(settings, 'third'),
      heatSet3: this._getHeatSetWithSettings(settings, 'third'),
      transitionTime4: this._getTransitionTimeWithSettings(settings, 'fourth'),
      heatSet4: this._getHeatSetWithSettings(settings, 'fourth'),
    }
    this._thermostatCluster().setWeeklySchedule(payload).then(value => {
      this.log(`setWeeklySchedule `, value)
    }).catch(this.error)
  }

  _getDayOfWeekWithSettings (settings) {

    console.assert(settings.hasOwnProperty('repeat'), `no repeat`)

    let repeat = settings['repeat']

    switch (repeat) {
      case 'everyday':
        return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      case 'weekday':
        return ['mon', 'tue', 'wed', 'thu', 'fri']
      case 'weekend':
        return ['sun', 'sat']
      case 'sunday':
        return ['sun']
      case 'monday':
        return ['mon']
      case 'tuesday':
        return ['tue']
      case 'wednesday':
        return ['wed']
      case 'thursday':
        return ['thu']
      case 'friday':
        return ['fri']
      case 'saturday':
        return ['sat']
      default:
        break
    }

    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  }

  _getTransitionTimeWithSettings (settings, leading) {

    let hourKey = `${leading}_hour`
    let minuteKey = `${leading}_minute`

    console.assert(settings.hasOwnProperty(hourKey), `no ${hourKey}`)
    console.assert(settings.hasOwnProperty(minuteKey), `no ${minuteKey}`)

    let hour = settings[hourKey]
    let minute = settings[minuteKey]
    return hour * 60 + minute
  }

  _getHeatSetWithSettings (settings, leading) {

    let targetKey = `${leading}_target`
    console.assert(settings.hasOwnProperty(targetKey), `no ${targetKey}`)

    return settings[targetKey] * 100.0
  }

  _setDeviceSettings (newSettings, changedKeys) {

    let payload = {}

    if (newSettings.hasOwnProperty('operate_display_brightness')) {
      payload['operateDisplayBrightness'] = newSettings['operate_display_brightness']
    }

    if (newSettings.hasOwnProperty('display_auto_off_activation')) {
      payload['displayAutoOffActivation'] = newSettings['display_auto_off_activation']
    }

    if (newSettings.hasOwnProperty('power_up_status')) {
      payload['powerUpStatus'] = newSettings['power_up_status']
    }

    if (newSettings.hasOwnProperty('window_open_check')) {
      payload['windowOpenCheck'] = newSettings['window_open_check']
    }

    if (newSettings.hasOwnProperty('localTemperatureCalibration')) {
      let localPayload = {}
      localPayload['localTemperatureCalibration'] = newSettings['localTemperatureCalibration']
      this.log(`set localTemperatureCalibration `, localPayload)
      this._thermostatCluster().writeAttributes(localPayload).catch(this.error)
    }

    if (newSettings.hasOwnProperty('hysteresis')) {
      payload['hysteresis'] = Math.round(newSettings['hysteresis'] * 10.0)
    }

    if (payload === {}) {
      return
    }

    this.log(`setDeviceSettings `, payload)
    this._thermostatCluster().writeAttributes(payload).catch(this.error)
  }

  _setThermostatUIConfiguration (newSettings, changedKeys) {

    if (changedKeys.indexOf('keypadLockout') < 0) {
      return
    }

    let payload = {}

    if (newSettings.hasOwnProperty('keypadLockout')) {
      payload['keypadLockout'] = newSettings['keypadLockout']
    }

    this.log(`_setThermostatUIConfiguration `, payload)
    this._thermostatUserInterfaceConfiguration().
      writeAttributes(payload).
      catch(this.error)
  }

  _getAttributes () {

    /*
    this._thermostatUserInterfaceConfiguration().
      readAttributes(['keypadLockout']).
      then(value => {
        this.log(`thermostatUserInterfaceConfiguration `, value)
      }).
      catch(this.error)
     */

    this._thermostatCluster().
      readAttributes(['windowOpenFlag']).
      then(value => {
        this.log(`_getTestAttributes `, value)

        if (value.hasOwnProperty('windowOpenFlag')) {
          let isOpen = value['windowOpenFlag'] === 'opened'
          this.setCapabilityValue('zg9030a_window_open_flag',
            isOpen ? 'Opened' : 'Closed')
        }

      }).
      catch(this.error)

  }

}

module.exports = ZG9093ADevice
