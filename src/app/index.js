'use strict';

angular.module('transmartBaseUi', [
  'ngAnimate',
  'ngCookies',
  'ngTouch',
  'ngSanitize',
  'restangular',
  'ui.router',
  'ui.bootstrap',
  'restangular'
])

  .config( ['$stateProvider', '$urlRouterProvider', 'RestangularProvider',
    function ($stateProvider, $urlRouterProvider, RestangularProvider) {

    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'components/login/login.html',
        controller: 'LoginCtrl'
      });

    // =========================
    // Set restful api base url
    // =========================
    RestangularProvider.setBaseUrl('http://localhost:8080/transmart/');

  }])

  .run(['$rootScope', '$location', '$cookieStore', '$http',
    function ($rootScope, $location, $cookieStore, $http) {

      // keep user logged in after page refresh
      $rootScope.globals = $cookieStore.get('globals') || {};

      if ($rootScope.globals.access_token) {
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $rootScope.globals.access_token;
      }

      $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !$rootScope.globals.access_token) {
          $location.path('/login');
        }
      });
    }]);
