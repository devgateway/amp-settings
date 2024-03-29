var Deferred = require('jquery').Deferred;
var _ = require('underscore');
var Backbone = require('backbone');
var Setting = require('../models/settings-definitions');
var Config = require('../common/config');
var Constants = require('../common/constants');

module.exports  = Backbone.Collection.extend({
	model : Setting,
	comparator: 'id',
	firstTime: true,
	initialize: function(models, options) {
		this.options = options;
		this.url = options.definitionUrl;
		this.app = options.app;
		this.loaded = new Deferred();
		_.bindAll(this,'load');
	},
	parse: function(settings) {
		return settings;	    
	},
	load: function() {
		if (this.firstTime) {
			this.firstTime = false;
			if (this.loaded.state() !== 'pending') { return this.loaded.promise(); }
			this.fetch({})
			.then(_(function() {
				this.loaded.resolve();
			}).bind(this))
			.fail(_(function() {			       
				this.loaded.reject();
			}).bind(this));
		}    
		return this.loaded.promise();
	},
	findCurrencyById: function(id){
		return _.find(this.get(Constants.CURRENCY_ID).get('value').options, function(option){ return option.id === id });		 
	},
    findAmountUnitsById: function(id){
		return _.find(this.get(Constants.AMOUNT_UNIT_ID).get('value').options, function(option){ return option.id === id });
	},
    findAmountUnitsByValue: function(value){
		return _.find(this.get(Constants.AMOUNT_UNIT_ID).get('value').options, function(option){ return option.value === value });
	},
	findCalendarById: function(id){
		return _.find(this.get(Constants.CALENDAR_ID).get('value').options, function(option){ return option.id === id });
	},
	findFundingTypeById: function(id){
		return _.find(this.get(Constants.FUNDING_TYPE_ID).get('value').options, function(option){ return option.id === id });
	},
	getCurrencySetting: function(){
		return this.get(Constants.CURRENCY_ID);
	},
	getProgramSetting: function(){
		return this.get(Constants.PROGRAM_SETTINGS);
	},
	getAmountUnitsSetting: function(){
		return this.get(Constants.AMOUNT_UNIT_ID);
	},
	getCalendarSetting: function(){
		return this.get(Constants.CALENDAR_ID);
	},	
	getFundingTypeSetting:function(){
		return this.get(Constants.FUNDING_TYPE_ID);
	},
	getDefaultCurrencyId: function(){
		return this.getCurrencySetting().get('value').defaultId;
	},
	getDefaultProgramSetting: function(){
		return this.getProgramSetting().get('value').defaultId;
	},
	getDefaultAmountUnitsId: function(){
		return this.getAmountUnitsSetting().get('value').defaultId;
	},
	getDefaultCalendarId: function(){
		return this.getCalendarSetting().get('value').defaultId;
	},
	getDefaultFundingTypeById: function(){
		return this.getFundingTypeSetting().get('value').defaultId;
	},
	getSelectedOrDefaultCurrencyId : function() {
	    return this.app.toAPIFormat()[Constants.CURRENCY_ID] || this.getDefaultCurrencyId();
	},
	getSelectedOrDefaultProgramSetting : function() {
		return this.app.toAPIFormat()[Constants.PROGRAM_SETTINGS] || this.getDefaultProgramSetting();
	},
	getSelectedOrDefaultCalendarId : function() {
		return this.app.toAPIFormat()[Constants.CALENDAR_ID] || this.getDefaultCalendarId();
	},
	getSelectedOrDefaultFundingTypeId : function() {
		return this.app.toAPIFormat()[Constants.FUNDING_TYPE_ID] || this.getDefaultFundingTypeById();
	}
});

