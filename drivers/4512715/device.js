'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

class SwitchLight extends ZwaveDevice {

  async onNodeInit ({ node }) {
    super.onNodeInit({ node })

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_BINARY')

    this.registerReportListener('BASIC', 'BASIC_REPORT', report => {
      if (report && report.hasOwnProperty('Current Value')) {
        this.setCapabilityValue('onoff', report['Current Value'] > 0).catch(this.error)
      }
    })
  }

}

module.exports = SwitchLight
