'use strict';

const { ZigBeeDriver } = require('homey-zigbeedriver');

class D628ZG_1402768 extends ZigBeeDriver {
    async onInit() {
        this.log('1402768 (D628-ZG) has been initialized');
      } 
}

module.exports = D628ZG_1402768;