'use strict';

angular.module('transmartBaseUi')
  .controller('MainCtrl',
  ['$scope', 'Restangular', 'ChartService', 'AlertService', function ($scope, Restangular, ChartService, AlertService) {

    $scope.dataLoading = false;

    $scope.close = AlertService.remove;
    $scope.alerts = AlertService.get();

    $scope.metadata = {
      Title: 'Node title',
      Organism: 'Homo sapiens',
      Description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris faucibus ut nisl quis ullamcorper. Quisque in orci vitae nibh rhoncus blandit. Integer tincidunt nunc sit amet magna faucibus, eget pellentesque libero finibus. Sed eu cursus risus, ac pretium felis. In non turpis eros. Nam nec tellus venenatis, consectetur dui a, posuere dui. In id pellentesque elit, ac mattis orci. Donec aliquam feugiat neque nec efficitur. Donec fermentum posuere diam, quis semper felis aliquam vel. Praesent sit amet dapibus tortor. Aliquam sed quam non augue imperdiet scelerisque. Vivamus pretium pretium eros. Nullam finibus accumsan tempor. Duis mollis, ex nec maximus bibendum.'
    };

    $scope.magicConcepts = ['sex', 'race','age',  'religion', 'maritalStatus'];
    $scope.titles = ['Sex', 'Race','Age',  'Religion', 'Marital Status'];

    $scope.selectedStudy = {};

    $scope.displayStudySummaryStatistics = function (study) {
      ChartService.displaySummaryStatistics(study, $scope.magicConcepts);
      $scope.selectedStudy.title = study.id;

      var _setLoadingAnim = function (data, chart) {
        $scope.dataLoading = data;
        $scope.chartLoading = chart;
      };

      _setLoadingAnim(true, false);



      _setLoadingAnim(false, false);
    };

    /*******************************************************************************************************************
     * Cohort selection
     */

    /**
     * Quantity of subjects remaining in cohort selection after filters are applied
     * @type {number}
     */
    $scope.cohortSelected = 0;

    /**
     * Initial quantity of subjects in selected nodes for cohort selection
     * @type {number}
     */
    $scope.cohortTotal = 0;

    /**
     *
     * @type {Array}
     */
    $scope.cohortChartContainerLabels = [];

    /**
     * Update quantity of containers necessary for displaying the graphs in cohort selection
     */
    $scope.$on('prepareChartContainers', function(event, labels) {
      $scope.cohortChartContainerLabels = labels;
    });

    /**
     * Callback for node drop
     * @param event drop event
     * @param info
     * @param node Dropped node
     */
    $scope.onNodeDropEvent = function(event, info, node){
      _addCohort(node);
    };

    $scope.removeLabel = function (label){
      ChartService.removeLabel(label);
    };

    /**
     * Reset the active nodes for cohort selection
     */
    $scope.resetActiveLabels = function(){
      $scope.cohortSelected = 0;
      $scope.cohortTotal = 0;
      ChartService.reset();
    };

    /**
     * Add node dropped from concept tree
     * @param node
     * @private
     */
    var _addCohort = function (node) {

      $scope.cohortUpdating = true;

      ChartService.addNodeToActiveCohortSelection(node).then(function(charts){
        $scope.cohortSelected = ChartService.getSelectionValues().selected;
        $scope.cohortTotal = ChartService.getSelectionValues().total;

        // Update the selection value on filtering the charts
        charts.forEach(function(chart){
          chart.on('postRedraw', function (){
            $scope.cohortSelected = ChartService.getSelectionValues().selected;
            $scope.cohortTotal = ChartService.getSelectionValues().total;
            $scope.$apply();
          });

          ChartService.renderAll(charts);
          $scope.cohortUpdating = false;
          //$scope.$apply();
        });
      });
    }
  }]);
