'use strict';

angular.module('transmartBaseUi')
  .controller('LoginCtrl', ['$scope', '$state', '$location', 'AuthenticationService', function ($scope, $state, $location, AuthenticationService) {

    $scope.alerts = []; // init alerts

    // reset login status
    AuthenticationService.ClearCredentials();

    $scope.login = function () {
      $scope.dataLoading = true;
      AuthenticationService.Login($scope.username, $scope.password, function(response) {
        if (response) {
          AuthenticationService.SetCredentials(response.access_token);
          $location.path('/');
        } else {
          $scope.alerts.push({type: 'danger', msg: 'Invalid login credentials.' });
          $scope.error = response.message;
          $scope.dataLoading = false;
        }
      });
    };

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

  }]);
