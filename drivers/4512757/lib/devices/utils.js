const { device } = require("./work_power");

const getCapabilityValue = (device, capability) => {
  return (capability in (device.capabilitiesObj || {})) ? device.capabilitiesObj[capability].value : null;
};

const returnCapabilityValue = (device, capability, xfrm = v => v) => {
  return function(callback) {
    const value = getCapabilityValue(device, capability);
    return callback(null, value === null ? this.value : xfrm(value));
  }
};

const DEFAULT_GROUP_NAME = 'default';

const getCapabilityNameSegments = (name) => {
	const [capabilityBaseName, groupName = DEFAULT_GROUP_NAME] = name.split('.');

	return { capabilityBaseName, groupName };
};

/**
 * in some cases there are capabilities with group suffix,
 * e.g. 'onoff' and 'onoff.1',
 * we will transform base capabilities list into list of distinct groups
 * e.g.
 * [
 *   { groupName: 'default', capabilities: ['onoff'] },
 *   { groupName: '1', capabilities: ['onoff.1'] },
 * ]
 */
const getCapabilityGroups = (capabilities, supportedCapabilityFilter = () => true) => {
    return capabilities.reduce((groups, capability) => {
        const { groupName, capabilityBaseName } = getCapabilityNameSegments(capability)
        if (!supportedCapabilityFilter(capabilityBaseName)) {
            return groups;
        }

        const group = groups.find((group) => group.groupName === groupName);

        if (!group) {
            groups.push({
                groupName,
                capabilities: [capability],
            })
        } else {
            group.capabilities.push(capability);
        }

        return groups;
    }, [])
}

const setupDevice = (accessory, device) => {
   
}

const updateTempCapOptions = async (device, min, max, step, capabilityName) => {
  try {
    if (!device.hasCapability(capabilityName)) return;
    
      let capOptions = device.getCapabilityOptions(capabilityName);
      console.log('温度选项', capOptions);
      if ((min !== undefined ? min : capOptions.min) >= (max !== undefined ? max : capOptions.max)) {
        return Homey.__('error.invalid_target_temps');
      }
    
      if (min || max || step) {
        //if (min && capOptions.min !== min) {
          capOptions.min = min;
        //}
        //if (max && capOptions.max !== max) {
          capOptions.max = max;
        //}
        //if (step && capOptions.step !== step) {
          capOptions.step = step;
          capOptions.decimals = step >= 0.5 ? 1 : 2;
        //}
        //capOptions.unit = "";
        await device.setCapabilityOptions(capabilityName, capOptions);
        //this.log(`Updated cap options from ${min} ${max} ${step} for target temperature`, this.getCapabilityOptions('target_temperature'));
      }
    } catch (err) {
        console.log('updateTempCapOptionsStep ERROR', err);
    }
};

  
const checkThermostatModeByTargetTemp = async (device, node, value) => {
  let modeStr = 'Auto';
    if (value > device.current_measure_temperature){
      device.setCapabilityValue(device.thermostat_mode_name,'heat');
      modeStr = 'Heat'; 
    }
    else if (value < device.current_measure_temperature){
      device.setCapabilityValue(device.thermostat_mode_name,'cool');
      modeStr = 'Cool'; 
    }
    else{
      device.setCapabilityValue(device.thermostat_mode_name,'auto'); 
    }

    console.log('d', '...THERMOSTAT_MODE_SET');
    let manuData = Buffer.alloc(2);
    
    await node.CommandClass.COMMAND_CLASS_THERMOSTAT_MODE.THERMOSTAT_MODE_SET({
      Level: {
        'No of Manufacturer Data fields': 0,
        Mode: modeStr
      },
      'Manufacturer Data':manuData
    });
}
 
const setTargetTemperature = async (device, node, value) => {
  console.log('e', '----========= setTargetTemperature: ');
  if (!device.hasCapability(device.thermostat_mode_name)){
    return;
  }

  let tm = device.getCapabilityValue(device.thermostat_mode_name) || '';
  console.log('e', 'setTargetTemperature', tm);
  if (tm === 'heat'){
     
  }

  const bufferValue = Buffer.alloc(2);
  const newValue = ((Math.round(value * 2) / 2) * 10).toFixed(0);
  bufferValue.writeUInt16BE(newValue);
  console.log('设置温度：setTargetTemperature - setParser(),old,new', value, newValue, 'mode=', tm);

  let payload = {
    Level: {
      'Setpoint Type': tm === 'heat' ? 'Heating 1' : 'Cooling 1',
    },
    Level2: {
      Size: 2,
      Scale: 0,
      Precision: 1,
    },
    Value: bufferValue
  }; 
  await node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT.THERMOSTAT_SETPOINT_SET(payload);
  device.homey.settings.set('target_temperature', value);
};
    

const setConfiguratrion = async (device, node, pn, size, def, value) => { 
  await device.configurationSet({ index: pn, size:size }, value); 
};

const toggleSwitch = async ( device, node, onoff) => {
  let payload = { 
    'Target Value' : onoff, 'Duration':'00'
  };
  console.log('switch', payload);
  await node.CommandClass.COMMAND_CLASS_SWITCH_BINARY.SWITCH_BINARY_SET(payload);
};

const setProtection = async( device, node, pn, size, def, value) => {
  
  let payload = {
    Level : { 'Local Protection State' : value, 'Reserved1':0 },
    Level2 : { 'RF Protection State' : 0, 'Reserved2':0 }
  }
  console.log('setProtection', payload);
  await node.CommandClass.COMMAND_CLASS_PROTECTION.PROTECTION_SET(payload);
};

const PuCapability = (pu) => {
  let capability = '';
  switch (pu) {
    case 4:
      capability = 'eco_mode';
      break;
    case 8:
      capability = 'window_check';  
      break;
    case 58:
      //0x3A
      capability = 'run_mode';
      break;

    default:
      break;
  }
  return capability;
};


const sensor_i2s = (i) => {
  let s = '';
  switch (i) {
    case 0:
      s = 'a';
      break;
    case 1:
      s = 'f';
      break;
    case 2:
      s = 'af';
      break;
    case 3:
      s = 'a2';
      break;
    case 4:
      s = 'a2f';
      break;
    case 5:
      s = 'fp';
      break;
    case 6:
      s = 'p';
      break;
  
    default:
      s = 'f';
      break;
  }
  return s;
};

module.exports = {
    getCapabilityValue,
    returnCapabilityValue,
    getCapabilityNameSegments,
    getCapabilityGroups,
    setupDevice,
    DEFAULT_GROUP_NAME,
    updateTempCapOptions,
    setConfiguratrion,
    checkThermostatModeByTargetTemp,
    setTargetTemperature,
    PuCapability,
    setProtection,
    toggleSwitch,
    sensor_i2s
}
