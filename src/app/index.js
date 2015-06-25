'use strict';

angular.module('transmartBaseUi', [
  'ngAnimate',
  'ngCookies',
  'ngTouch',
  'ngSanitize',
  'restangular',
  'ui.router',
  'ui.bootstrap',
  'restangular',
  'ui.tree',
  'smart-table',
  'angular-loading-bar',
  'ngDragDrop'
])

  .config( ['$stateProvider', 'RestangularProvider', '$tooltipProvider', 'cfpLoadingBarProvider',
    function ($stateProvider, RestangularProvider, $tooltipProvider, cfpLoadingBarProvider) {

      $stateProvider
        .state('main', {
          url: '/',
          templateUrl: 'app/main/main.html',
          controller: 'MainCtrl'
        })
        .state('login', {
          url: '/login',
          templateUrl: 'app/components/login/login.html',
          controller: 'LoginCtrl'
        });

      // =========================
      // Set restful api base url
      // =========================
      RestangularProvider.setBaseUrl('http://localhost:8001/rest');
      RestangularProvider.setDefaultHeaders(
        {'Accept': 'application/hal+json'}
      );

      // Set an interceptor in order to parse the API response
      // when getting a list of resources
      RestangularProvider.setResponseInterceptor(function(data, operation, what) {

        if(typeof data === 'string'){ //OMG.. why
          data = JSON.parse(data);
        }

        /**
         * Get the last token when requested model is a string path
         * @param what
         * @returns {*}
         * @private
         */
        var _getLastToken = function (what) {
          var _t = what.split('/').slice(1);
          return what.indexOf('/') === -1 ? what : _t[_t.length-1];
        };

        if (operation === 'getList') {
            var _what, resp = data;
            if (what === 'concepts') {
              what = 'ontology_terms';
              resp =  data._embedded[what];
            } else {
              _what = _getLastToken(what);
              resp =  data._embedded[_what];
            }
            return resp;
          }
        return data;
      });

      //// Using self link for self reference resources
      RestangularProvider.setRestangularFields({
        selfLink: 'self.link'
      });

      // Set default actions for popover
      $tooltipProvider.setTriggers({'click': 'never'});
      $tooltipProvider.options({
        placement: 'right',
        appendToBody: 'true',
        trigger: 'click'
      });

      // Remove spinner from http request loading bar
      cfpLoadingBarProvider.includeSpinner = false;
  }])

  .run(['$rootScope', '$location', '$cookieStore', '$http', 'EndpointService',
    function ($rootScope, $location, $cookieStore, $http, EndpointService) {

      EndpointService.addEndpoint('Local', 'http://localhost:8080/transmart-rest-api');

      // keep user logged in after page refresh
      $rootScope.globals = $cookieStore.get('globals') || {};

      if ($rootScope.globals.currentUser) {
        $http.defaults.headers.common.Authorization = 'Basic ' + $rootScope.globals.currentUser.authdata;
      }

      $rootScope.$on('$locationChangeStart', function () {
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
          $location.path('/login');
        }
      });
    }]);
