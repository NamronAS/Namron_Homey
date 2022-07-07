const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');

module.exports = {
  device:null,
  node:null,
  pu:118,
  capability: 'regulator',
  init:function(device, node){
    device.appkits['pu'+this.pu] = this;
    this.startReport(device);
    return this;
  },
  registerCapability:function(){
      return this;
  },

  startReport:function(device){
    device.registerCapabilityListener(this.capability,
        async (payload) => { 
          //button 操作设置
          console.log('regulator BUTTON SET:', payload);
          
            if (payload === false){   
              //不启用
              const settings = device.getSettings();
              let mode = settings.sensor_mode; 
              if (mode === 'p'){
                mode = 'f';
                device.setSettings({ 
                  sensor_mode: mode,
                }); 
              }
              //sensor_mode !p
              device.appkits['pu43'].setConfig(device, mode); 
              //regulator set 0(off)
              setConfiguratrion(device, null, this.pu, 1, false, 0);

            } else if (payload === true){

              //set p mode
              device.setSettings({ 
                sensor_mode: 'p',
              }); 
              const settings = device.getSettings();   
              let reg = settings.regulator;
              let num = reg.replace('min', '');
              num = num.trim();

              //sensor_mode
              setConfiguratrion(device, null, 43, 1, false, 6);   
              //regulator set min
              setConfiguratrion(device, null, this.pu, 1, false, num); 

           }
            

            
            device.setStoreValue('regulator_mode_changed', true);
 
            device.showMessage('The regulator mode has changed. Please go back and click `hzc_thermostat` to turn it on again.');
            //device.restartApp();
            
            //if (!device.hasCapability('app_reset')){
            //  device.addCapability('app_reset');
            //}

        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    //config 设置（是否需要更改 regulator mode .....)
    let min = parseInt(payload, 10);
    console.log('set regulator heating min', min);
    setConfiguratrion(device, null, this.pu, 1, false, min);
  },
  update:function(device, payload, config){
    
    console.log('regulator min REV:', payload, config);
    let strConfig = "" + config + "";
    device.setSettings({ 
      regulator: strConfig,
    }); 
    console.log('update config: regulator min', strConfig);
  

  }
}  