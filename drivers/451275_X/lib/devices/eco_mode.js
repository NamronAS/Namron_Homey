'use strict'
const { CLUSTER, Cluster, ZCLDataTypes } = require('zigbee-clusters')
const {
    getOptBaseTime
} = require('./utils');

module.exports = {
    init(device) {
        this.registerCapability(device);
    },
    registerCapability(device) {
        if (!device.hasCapability('eco_mode')) return

        device.thermostatCluster().on('attr.thermostatProgramOperModel', async value => {
            device.log(`-- App Rev eco_mode report = `, value)
            const res = value.getBits();
            if (device.hasCapability('eco_mode')) {
                device.setCapabilityValue('eco_mode', res.includes('eco')) 
            }
        })

        device.registerCapabilityListener('eco_mode', async value => {

            if (device.hasCapability('t7e_zg_thermostat_mode')) {
                let cur_thermostat = device.getCapabilityValue('t7e_zg_thermostat_mode');
                if (cur_thermostat !== 'heat') {
                    await device.setWarning("Failed to set ECO mode").catch(this.error);
                    return
                }
            }


            let payloads = { ecoMode: value }
            device.log(`-- App Send eco_mode = `, value)
            try{
                await device.thermostatCluster().setEco(payloads).catch(err => {
                    device.log('--- App Send eco_mode = ', value, 'ERR: ', err)
                    if (device.hasCapability('eco_mode')){
                        device.setCapabilityValue('eco_mode', !value).catch(this.error)
                    }
                })
            }catch(error){
                device.log('--- App Send eco_mode = ', value, 'ERR: ', error)
            }
            

        })

    },

} 