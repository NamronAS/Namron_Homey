const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion,
    sensor_i2s
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:43,
  capability: 'sensor_mode',
  init:function(device, node){
    device.appkits['pu'+this.pu] = this;
    this.startReport(device);
    return this;
  },
  registerCapability:function(){
      return this;
  },

  startReport:function(device){
    device.registerCapabilityListener('sensor_mode',
        async (payload) => {  
          console.log('Listener sensor_mode REV ', payload); 
          //this.setConfig(device, payload); 

        }
    ); 
    return this;  
  },
  setConfig: function(device, payload){
    console.log('setConfig sensor mode SET:', payload);

    

    if (payload === "a"){   
      setConfiguratrion(device, null, this.pu, 1, false, 0);
    } else if (payload === "f"){ 
      setConfiguratrion(device, null, this.pu, 1, false, 1);  
    } else if (payload === "af"){
      setConfiguratrion(device, null, this.pu, 1, false, 2);
    } else if (payload === "a2"){
      setConfiguratrion(device, null, this.pu, 1, false, 3);
    } else if (payload === "a2f"){
      setConfiguratrion(device, null, this.pu, 1, false, 4);
    } else if (payload === "fp"){
      setConfiguratrion(device, null, this.pu, 1, false, 6);
    } else if (payload === "p"){
      setConfiguratrion(device, null, this.pu, 1, false, 6);   
    }
    else{
      setConfiguratrion(device, null, this.pu, 1, false, -1);
    } 

    let ischanged = false;
    let settings = device.getSettings();
    if (payload === "p"){
      ischanged = true; 
      device.setStoreValue('regulator_mode', '1');
    }
    else{
      if (settings.sensor_mode === "p"){
        ischanged = true; 
        device.setStoreValue('regulator_mode', '0');
      } 
    }

    console.log('d', 'setConfig:(ischanged) ', ischanged); 
    if (ischanged){ 
      device.setStoreValue('regulator_mode_changed', ischanged); 
      device.showMessage('The regulator mode has changed. Please go back and click `hzc_thermostat` twice to turn it on again.');
    }
    

  }, 
  update:function(device, payload, config){ 
    console.log('update sensor mode REV:', config); 
     
          let ischanged = false;
          let settings = device.getSettings();  
          console.log('d', 'settings: ', settings);
          if (config === 6){
            set_new_mode = true; 
            if (settings.sensor_mode !== "p")
            {
              ischanged = true;  
            }

            device.setSettings({ 
              sensor_mode: 'p',
              thermostat_regulator_mode:'1'
            });
            device.setStoreValue('regulator_mode', '1');
            if (device.hasCapability('regulator')){
              device.setCapabilityValue('regulator', true); 
            } 
          }
          else{
            set_new_mode = false;
            if (settings.sensor_mode === 'p'){
              ischanged = true;  
            }
            let s = ""+sensor_i2s(config); 
            device.setSettings({ 
              sensor_mode: s,
              thermostat_regulator_mode:'0'
            });
            device.setStoreValue('regulator_mode', '0');
            console.log('sensor mode REV:', config,  s);
            if (device.hasCapability('regulator')){
              device.setCapabilityValue('regulator', false);
            }
          }
 
          console.log('d', 'sensor mode REV:(ischanged) ', ischanged);
          if (ischanged){ 
            device.setStoreValue('regulator_mode_changed', ischanged); 
            device.showMessage('The regulator mode has changed. Please go back and click `hzc_thermostat` twice to turn it on again.');
          }
          
    
          
          /*if (!device.hasCapability('app_reset')){
            device.addCapability('app_reset');
          }*/
           
          

  }
}  