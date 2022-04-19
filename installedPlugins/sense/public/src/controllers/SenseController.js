require('ui/doc_title');


require('ui/modules')
.get('app/sense')
.controller('SenseController', function SenseController($scope, docTitle) {

  docTitle.change('Sense');

  // require the root app code, which expects to execute once the dom is loaded up
  require('../app');

  const ConfigTemplate = require('ui/ConfigTemplate');
  const input = require('../input');
  const es = require('../es');
  const storage = require('../storage');

  this.dropdown = new ConfigTemplate({
    welcome: '<sense-welcome></sense-welcome>',
    history: '<sense-history></sense-history>',
    settings: '<sense-settings></sense-settings>',
    help: '<sense-help></sense-help>',
  });

  /**
   * Display the welcome dropdown if it has not been shown yet
   */
    if (storage.get('version_welcome_shown') !== 'd311bd417ad70d1ad35a4ad921dddbead5a13690') {
    this.dropdown.open('welcome');
  }

  this.sendSelected = () => {
    input.focus();
    input.sendCurrentRequestToES();
    return false;
  };

  this.autoIndent = (event) => {
    input.autoIndent();
    event.preventDefault();
    input.focus();
  };

  this.serverUrl = es.getBaseUrl();

  // read server url changes into scope
  es.addServerChangeListener((server) => {
    $scope.$evalAsync(() => {
      this.serverUrl = server;
    });
  });
});
