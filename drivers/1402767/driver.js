'use strict';

const { ZigBeeDriver } = require('homey-zigbeedriver');

class dimmer_2pol_zb689 extends ZigBeeDriver {
    async onInit() {
        this.log('1402767 - Zigbee 2 pol Dimmer :  has been initialized');
      }
}

module.exports = dimmer_2pol_zb689;