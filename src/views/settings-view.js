var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Translator = require('amp-translate');
var Template = fs.readFileSync(__dirname + '/../templates/settings-template.html', 'utf8');
var SelectTemplate = fs.readFileSync(__dirname + '/../templates/select-template.html', 'utf8');
var SelectAmountUnitTemplate = fs.readFileSync(__dirname + '/../templates/select-amount-unit-template.html', 'utf8');
var YearRangeTemplate = fs.readFileSync(__dirname + '/../templates/year-range-template.html', 'utf8');
var YearSelectTemplate = fs.readFileSync(__dirname + '/../templates/year-select-template.html', 'utf8');
var Constants = require('../common/constants');
const GisSettings = require("../models/gis-settings");
var gisSettings = new GisSettings();
module.exports = Backbone.View.extend({
	template : _.template(Template),
	selectTemplate : _.template(SelectTemplate),
    selectAmountUnitTemplate : _.template(SelectAmountUnitTemplate),
	yearRangeTemplate : _.template(YearRangeTemplate),
	yearSelectTemplate : _.template(YearSelectTemplate),
	events : {
		'click .apply-btn' : 'applySettings',
		'change select' : 'optionChanged',
		'click .cancel' : 'close',
		'click .close' : 'close',
		'click .reset-btn' : 'resetSettings',
	},
	appliedSettings : {},
	settingsSelections : {},
	initialize : function(options) {
		this.definitions = options.definitions;
		this.isPopup = options.isPopup;
		this.caller = options.caller;
		if (options.translator === undefined) {
			this.createTranslator(true);
		} else {
			this.translator = options.translator;
		}
		this.appliedSettings = {};
		this.settingsSelections = {};
		_.bindAll(this, 'render', 'applySettings', 'updateUI', 'appendSetting', 'appendYearRangeSetting', 'configureUI','selectDefaults', 'resetSettings');
	},
	render : function() {
		var self = this;
		self.$el.html(self.template({
			isPopup : this.isPopup
		}));		
		
		this.definitions.load().done(function() {
			self.selectDefaults();
			self.updateUI();
			self.originalSettings = self.appliedSettings;
			self.$el.show();
		});
		return this;
	},
	selectDefaults: function(reset) {		
		this.settingsSelections = {};
		if (_.isEmpty(this.appliedSettings) || reset) {
			if (reset) {
				this.appliedSettings = this.originalSettings;
			}
			this.settingsSelections[Constants.CALENDAR_ID] = this.definitions.findWhere({id : Constants.CALENDAR_ID }).get('value').defaultId;
			this.settingsSelections[Constants.PROGRAM_SETTINGS] = this.definitions.findWhere({id : Constants.PROGRAM_SETTINGS }).get('value').defaultId;
			this.settingsSelections[Constants.CURRENCY_ID] = this.definitions.findWhere({id : Constants.CURRENCY_ID }).get('value').defaultId;
			if (this.caller === Constants.CONTEXT.REPORTS) {
                this.settingsSelections[Constants.AMOUNT_UNIT_ID] = this.definitions.findWhere({id : Constants.AMOUNT_UNIT_ID }).get('value').defaultId;
            }
			
			var fundingType = this.definitions.findWhere({id : Constants.FUNDING_TYPE_ID });
			if (this.caller !== Constants.CONTEXT.DASHBOARDS && fundingType) {
			   this.settingsSelections[Constants.FUNDING_TYPE_ID] = fundingType.get('value').defaultId;
			}
			
			var yearRangeSetting = this.definitions.findWhere({
				id : Constants.YEAR_RANGE_ID
			});
			if (yearRangeSetting) {				
				this.settingsSelections[Constants.YEAR_FROM_ID] = yearRangeSetting.get('value')[Constants.YEAR_FROM_ID];
				this.settingsSelections[Constants.YEAR_TO_ID] = yearRangeSetting.get('value')[Constants.YEAR_TO_ID];
			}			
		}
	},
	configureUI : function() {
		if (this.isPopup) {
			this.$el.addClass('panel panel-primary amp-settings-dialog');
			this.$('.panel-heading').show();
			this.$('.cancel-settings').show();
		} else {
			this.$('.panel-heading').hide();
			this.$('.cancel-settings').hide();
		}
	},
	updateUI : function() {
		this.configureUI();
		this.$('.settings').html('');
		this.appendSetting(Constants.CALENDAR_ID);
		this.appendSetting(Constants.CURRENCY_ID);
        if (this.caller === Constants.CONTEXT.REPORTS) {
            this.appendAmountUnitSetting();
        }
		if (this.caller !== Constants.CONTEXT.DASHBOARDS) {
			this.appendSetting(Constants.FUNDING_TYPE_ID);
		}
		console.log("Gis setting in amp.gis",gisSettings.gisSettings)
		if (gisSettings.gisSettings.gis_programs_enabled ===true) {
			this.appendSetting(Constants.PROGRAM_SETTINGS);
		}

		this.appendYearRangeSetting();
		this.translate(this.$el);
	},
	appendSetting : function(settingID) {
		var setting = this.definitions.findWhere({
			id : settingID
		});
		if (setting) {
			this.$('.settings').append(this.selectTemplate({
				setting : setting.toJSON(),
				appliedSettings : this.appliedSettings,
				settingsSelections: this.settingsSelections
			}));
			if (settingID === Constants.CURRENCY_ID && _.isUndefined(this.allCurrencies)) {
				this.allCurrencies = setting.get('value').options;
			}
		}		
	},
	appendAmountUnitSetting : function() {
		var setting = this.definitions.findWhere({
			id : Constants.AMOUNT_UNIT_ID
		});
		if (setting) {
			this.$('.settings').append(this.selectAmountUnitTemplate({
				setting : setting.toJSON(),
				appliedSettings : this.appliedSettings,
				settingsSelections: this.settingsSelections
			}));
		}
	},
	appendYearRangeSetting : function() {
		var yearRangeSetting = this.definitions.findWhere({
			id : Constants.YEAR_RANGE_ID
		});
		if (yearRangeSetting) {
			this.$('.settings').append(this.yearRangeTemplate(yearRangeSetting.toJSON()));
			this.appendYearSelect(yearRangeSetting.get('value'), Constants.YEAR_FROM_ID);
			this.appendYearSelect(yearRangeSetting.get('value'), Constants.YEAR_TO_ID);
		}
	},
	appendYearSelect : function(yearRangeSetting, settingID) {
		var setting = {
			"name" : settingID,
			"id" : settingID,
			"rangeFrom" : yearRangeSetting['rangeFrom'],
			"rangeTo" : yearRangeSetting['rangeTo'],
			"from" : yearRangeSetting['from'],
			"to" : yearRangeSetting['to']
		};

		this.$('.year-range').append(this.yearSelectTemplate({
			setting : setting,
			appliedSettings : this.appliedSettings,
			settingsSelections: this.settingsSelections
		}));
	},
	getCurrenciesByCalendar : function(calendarId) {
		var calendarCurrencies = this.definitions.findWhere({
			id : Constants.CALENDAR_CURRENCIES_ID
		});
		var currencies = [];
		if (calendarCurrencies) {
			currencies = _.uniq(_.findWhere(calendarCurrencies.get('value').options, {
				id : calendarId
			}).value.split(','));
		}
		return currencies;
	},
	optionChanged : function(evt) {
		var self = this;
		var settingID = $(evt.currentTarget).attr('id');
		var selectedID = $(evt.currentTarget).val();

		if (settingID === Constants.YEAR_FROM_ID || settingID === Constants.YEAR_TO_ID) {
			if (settingID === Constants.YEAR_FROM_ID) {
				if (Number(selectedID) >= Number(self.appliedSettings[Constants.YEAR_RANGE_ID].to)
					|| Number(selectedID) >= Number(self.settingsSelections.to)) {
					if (self.settingsSelections.from) {
						$(evt.currentTarget).val(self.settingsSelections.from);
					} else {
						$(evt.currentTarget).val(self.appliedSettings[Constants.YEAR_RANGE_ID].from);
					}
				} else {
					this.updateSelected(settingID, selectedID);
				}
			} else {
				if (Number(selectedID) <= Number(self.appliedSettings[Constants.YEAR_RANGE_ID].from)
					|| Number(selectedID) <= Number(self.settingsSelections.from)) {
					if (self.settingsSelections.to) {
						$(evt.currentTarget).val(self.settingsSelections.to);
					} else {
						$(evt.currentTarget).val(self.appliedSettings[Constants.YEAR_RANGE_ID].to);
					}
				} else {
					this.updateSelected(settingID, selectedID);
				}
			}
		} else {
			this.updateSelected(settingID, selectedID);
			if (settingID === Constants.CALENDAR_ID) {
				this.updateCurrencyList(selectedID);
				this.updateUI();
			}
		}
	},
	updateCurrencyList : function(selectedCalendarId) {
		var self = this;
		// update currency select when calendar changes
		var availableCurrenciesForCalendar = self.getCurrenciesByCalendar(selectedCalendarId);
		self.definitions.get(Constants.CURRENCY_ID).get('value').options = [];
		$.each(availableCurrenciesForCalendar, function(index, object) {
			self.definitions.get(Constants.CURRENCY_ID).get('value').options.push(_.find(self.allCurrencies, function(item) {
				return item.id === object
			}));
		});
		
		
		var selectedCurrency = _.filter(availableCurrenciesForCalendar, function(curr){ return curr === self.settingsSelections[Constants.CURRENCY_ID] ; })[0];
		var appliedCurrency = _.filter(availableCurrenciesForCalendar, function(curr){ return curr === self.appliedSettings[Constants.CURRENCY_ID] ; })[0];
		var firstCurrency = availableCurrenciesForCalendar[0];
		this.updateSelected(Constants.CURRENCY_ID, selectedCurrency || appliedCurrency || firstCurrency);	
	},
	updateSelected : function(settingID, selectedID) {
		// store user selections in a temp object - only transfered to the applied settings if the apply button is clicked
		this.settingsSelections[settingID] = selectedID;
	},
    updateAppliedSettings: function () {
        // transfer user selections to applied settings object
        var self = this;
        _.each(this.settingsSelections, function (selectedID, settingID) {
            if (settingID === Constants.YEAR_FROM_ID || settingID === Constants.YEAR_TO_ID) {
                if (_.isUndefined(self.appliedSettings[Constants.YEAR_RANGE_ID])) {
                    self.appliedSettings[Constants.YEAR_RANGE_ID] = {};
                }
                self.appliedSettings[Constants.YEAR_RANGE_ID][settingID] = selectedID;
            } else {
                self.appliedSettings[settingID] = selectedID;
                if (settingID === Constants.AMOUNT_UNIT_ID) {
                    self.appliedSettings[Constants.AMOUNT_FORMAT_ID][Constants.AMOUNT_UNIT_ID] = Number(selectedID);
                }
            }
        });
        this.settingsSelections = {};
    },
	doResetSettings: function() {
		this.selectDefaults(true);
		this.updateUI();
	},
	getCurrent : function() {
		return this.appliedSettings;
	},
	restoreFromSaved : function(state) {
		var self = this;
		_.each(state, function(v, k) {
			self.appliedSettings[k] = v;
		});
		this.updateUI();
	},
	applySettings : function() {
		this.updateAppliedSettings();
		this.trigger('applySettings', this.appliedSettings);
	},
	resetSettings: function() {
		this.doResetSettings();
		this.trigger('resetSettings', this.originalSettings)
	},
	close : function() {
		this.settingsSelections = {};
		this.trigger('close');
	},
	createTranslator : function(force) {
		var self = this;
		var translateKeys = JSON.parse(fs.readFileSync(__dirname + '/../lib/initial-translation-request.json', 'utf8'));
		if (force === true || self.translator === undefined) {
			self.translator = new Translator({
				defaultKeys : translateKeys
			});
		}
	},
	translate : function(target) {
		var element = this;
		if (target !== undefined) {
			element = target;
		}
		if (element.el !== undefined) {
			this.translator.translateDOM(element.el);
		} else {
			this.translator.translateDOM(element);
		}
	}

});
