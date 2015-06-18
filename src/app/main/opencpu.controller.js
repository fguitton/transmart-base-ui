'use strict';

angular.module('transmartBaseUi')
  .controller('OpenCpuCtrl',
  ['$scope', 'Restangular', 'AlertService', '$http', function ($scope, Restangular, AlertService, $http) {

    ocpu.seturl("//localhost:8004/ocpu/library/testpak/R")

    $scope.makeChart = function(value,valuea,valueb){
      $scope.loading = true;
      var req = ocpu.call("func", {
        q: value,
        a: valuea,
        b: valueb
      }, function(session){

        $("#plotdiv").attr('src', session.getLoc() + "files/output.html");
        $scope.$apply(function(){
          $scope.dnlink = session.getLoc() + "files/output.html"
        })
        $scope.loading = false;
      }).fail(function(text){
        alert("Error: " + req.responseText);
      });
    }

    $scope.value = 10;
    $scope.valuea = 10;
    $scope.valueb = 10;

  }]);
