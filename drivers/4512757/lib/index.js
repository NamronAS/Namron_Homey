'use strict'

const protection = require('./devices/protection.js')

module.exports = {   
    
    meters : require('./devices/meters.js'),
    MasureTemperature: require('./devices/measure_temperature.js'),
    createSetpoint: require('./devices/setpoint.js'), 
    createSwitch: require('./devices/switch.js'), 
    ThermostatMode: require('./devices/thermostat_mode.js'), 
    TargetTemperature: require('./devices/target_temperature.js'),
    
    Configuration: require('./devices/configuration.js'),
    Notification : require('./devices/notification'), 
    Protection : require('./devices/protection'),
    
    adaption:require('./devices/adaption.js'),
    automatically_get_network_time: require('./devices/automatically_get_network_time.js'),
    child_lock : require('./devices/child_lock.js'),
    eco_mode: require('./devices/eco_mode.js'),
    frost : require('./devices/frost.js'),
    lcd_display_switch : require('./devices/lcd_display_switch.js'),
    run_mode: require('./devices/run_mode.js'),
    window_check: require('./devices/window_check.js'),

    work_days_set : require('./devices/work_days_set.js'),
    sensor_mode : require('./devices/sensor_mode.js'),
    regulator: require('./devices/regulator.js'),

    regulator_percentage: require('./devices/regulator_percentage.js'),

    temp_correction : require('./devices/temp_correction.js'),
    lcd_backlight_wait : require('./devices/lcd_backlight_wait.js'),
    lcd_backlight_work : require('./devices/lcd_backlight_work.js'),
    dif_celsius : require('./devices/dif_celsius.js'),
    dif_fahrenheit : require('./devices/dif_fahrenheit.js'),
    
    frost_celsius: require('./devices/frost_celsius.js'),
    frost_fahrenheit: require('./devices/frost_fahrenheit.js'),

    heat_celsius_temp_set : require('./devices/heat_celsius_temp_set.js'),
    heat_fahrenheit_temp_set: require('./devices/heat_fahrenheit_temp_set.js'),
    cool_celsius_temp_set : require('./devices/cool_celsius_temp_set.js'),
    cool_fahrenheit_temp_set : require('./devices/cool_fahrenheit_temp_set.js'),

    dry : require('./devices/dry.js'),

    celsius_flt : require('./devices/celsius_flt.js'),
    fahrenheit_flt : require('./devices/fahrenheit_flt.js'),

    week_program_time : require('./devices/week_program_time.js'),
    week_program_celsius_temp : require('./devices/week_program_celsius_temp.js'),
    week_program_fahrenheit_temp : require('./devices/week_program_fahrenheit_temp.js'),

    window_door_alarm : require('./devices/window_door_alarm'),
    work_power : require('./devices/work_power'),

    app_reset : require('./devices/app_reset'),

    thermostat_regulator_mode : require('./devices/thermostat_regulator_mode'), 
}


