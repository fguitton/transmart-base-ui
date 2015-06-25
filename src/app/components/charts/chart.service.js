'use strict';

angular.module('transmartBaseUi')

    .factory('ChartService', ['Restangular', '$q', '$rootScope', '$timeout',
        function (Restangular, $q, $rootScope, $timeout) {
            var chartService = {};

            /**
             * Create dc.js bar chart
             * @param cDimension
             * @param cGroup
             * @param el
             * @private
             */
            var _barChart = function (cDimension, cGroup, el, min, max, nodeTitle, width, height, btmMarg) {

                width = width || 270;
                height = height || 210;
                btmMarg = btmMarg || 30;

                var _barChart = dc.barChart(el);
                _barChart
                    .width(width)
                    .height(height)
                    .margins({top: 5, right: 5, bottom: btmMarg, left: 25})
                    .dimension(cDimension)
                    .group(cGroup)
                    .elasticY(true)
                    .centerBar(true)
                    .gap(1)
                    .x(d3.scale.linear().domain([min, max]))
                    .renderHorizontalGridLines(true)
                ;
                _barChart.xAxis().tickFormat(
                    function (v) {
                        return v;
                    });
                _barChart.yAxis().ticks(5);
                _barChart.xAxisLabel(nodeTitle);
                _barChart.yAxisLabel('# subjects');

                return _barChart;
            };

            /**
             * Create dc.js pie chart
             * @param cDimension
             * @param cGroup
             * @param el
             * @returns {*}
             * @private
             */
            var _pieChart = function (cDimension, cGroup, el, size, nolegend) {
                var tChart = dc.pieChart(el);

                nolegend = nolegend || false;
                size = size || 200;

                tChart
                    .width(size)
                    .height(size)
                    .innerRadius(0)
                    .dimension(cDimension)
                    .group(cGroup)
                    .renderLabel(false);

                if(!nolegend){
                    tChart.legend(dc.legend());
                }

                return tChart;
            };

            /**
             * Get the last token when requested model is a string path
             * @param what
             * @returns {*}
             * @private
             */
            var _getLastToken = function (what) {
                var _t = what.split('\\').slice(1);
                return what.indexOf('\\') === -1 ? what : _t[_t.length - 2];
            };

            /**
            *
            * @param charts
            */
            chartService.renderAll = function (charts) {
                angular.forEach(charts, function (chart) {
                  chart.render();
                });
            };

            /***********************************************************************************************************
            * Summary statistics chart service
            */
            var ss = {};

            chartService.displaySummaryStatistics = function(study, magicConcepts){
                study.one('subjects').get().then(function (d) {
                    var sub = d._embedded.subjects;

                    ss = {
                        charts: [],
                        cross: crossfilter(sub),
                        dims: {},
                        grps: {},
                    };

                    magicConcepts.forEach(function(concept){
                        ss.dims[concept] = ss.cross.dimension(function(d){return d[concept];})
                        ss.grps[concept] = ss.dims[concept].group();

                        if (typeof sub[0][concept] === 'string' || typeof sub[0][concept] === 'object') {
                          ss.charts.push(_pieChart(ss.dims[concept], ss.grps[concept], '#summary-chart-' + concept, 75, true));
                        } else if (typeof sub[0][concept] === 'number') {
                          var max = ss.dims[concept].top(1)[0][concept];
                          var min = ss.dims[concept].bottom(1)[0][concept];
                          ss.charts.push(_barChart(ss.dims[concept], ss.grps[concept], '#summary-chart-' + concept, min-5, max+5, '', 600, 100, 5));
                        }
                    });
                    chartService.renderAll(ss.charts);

                }, function (err) {
                    reject('Cannot get subjects from the end-point.' + err);
                });
            };

            /***********************************************************************************************************
             * Cohort chart service
             */
            var cs = {};

            /**
             * Reset the cohort chart service to initial state
             */
            chartService.reset = function () {
                cs = {
                     subjects: [],
                     chartId: 0,
                     charts: [],
                     cross: crossfilter(),
                     dims: {},
                     grps: {},
                     labels: []
                };

                cs.mainDim = cs.cross.dimension(function (d) {
                    return d.labels;
                });

                $rootScope.$broadcast('prepareChartContainers',cs.labels);
            };

            chartService.reset();

            /**
             * Add new label to list and check data type
             * @param label
             * @param value
             * @private
             */
            var _addLabel = function (obs) {
                var present = false;
                cs.labels.forEach(function(label){
                    present = label.label === obs.label ? true : present;
                });
                if(!present){
                    cs.labels.push({
                        label: obs.label,
                        type: typeof obs.value,
                        name: _getLastToken(obs.label),
                        ids: cs.chartId++,
                    });
                }
            };

            /**
             * Remove all the filters applied to the label dimensions
             * TODO: Add the possibility to reapply removed filters
             * @private
             */
            var _removeAllLabelFilters = function () {
                for (var key in cs.dims) {cs.dims[key].filterAll();}
            };

            /**
             * Fetch the data for the selected node
             * Add it to the current subject list
             * Recreate Crossfilter instance with all the new and old subjects
             * @param node
             * @returns {*}
             */
            chartService.addNodeToActiveCohortSelection = function (node){
                var _deferred = $q.defer();
                //Get all observations under the selected concept
                node.restObj.one('observations').get().then(function (observations){
                    observations = observations._embedded.observations;
                    observations.forEach(function (obs){
                        if(obs.value !== null) {
                            _addLabel(obs);
                            var found = _.findWhere(cs.subjects, {id: obs._embedded.subject.id});
                            if (found){
                              found.labels[obs.label] = obs.value;
                            } else {
                              obs._embedded.subject.labels = {};
                              obs._embedded.subject.labels[obs.label] = obs.value;
                              cs.subjects.push(obs._embedded.subject);
                            }
                        }
                    });

                    $rootScope.$broadcast('prepareChartContainers', cs.labels);
                    $timeout(function () {
                        _removeAllLabelFilters;
                        _populateCohortCrossfilter();
                        _createCohortCharts();
                        _deferred.resolve(cs.charts);
                    });
                }, function (err) {
                    //TODO: add alert
                    _deferred.reject('Cannot get data from the end-point.' + err);
                });
                return _deferred.promise;
            };

          /**
           * Remove specified label
           * @param label
           */
            chartService.removeLabel = function (label) {
                //Remove label from subjects and remove subjects no longer associated with any label
                for (var i = 0; i < cs.subjects.length; i++) {
                  cs.subjects[i].labels[label.label] = undefined;
                  if (_.size(cs.subjects[i].labels) === 0) cs.subjects(i--, 1);
                }
                //Update crossfilter instance
                _removeAllLabelFilters();
                _populateCohortCrossfilter;
                //Remove dimension and group associated with the label
                cs.dims[label.label].dispose();
                cs.grps[label.label].dispose();
                //Finally remove label
                cs.labels = _.reject(cs.labels, function(el) { return el.label === label.label; });
                //Update charts
                $rootScope.$broadcast('prepareChartContainers',cs.labels);
                dc.filterAll();
                dc.redrawAll();
            };

            /**
             * Create the Crossfilter instance from the subject data
             * @private
             */
            var _populateCohortCrossfilter = function () {
                cs.cross.remove();
                cs.cross.add(cs.subjects);
            };

            /**
             * Create the charts for each selected label
             * TODO: Leave the existing charts in place, and only add the new ones
             * TODO: Enable removing specific charts
             * @private
             */
            var _createCohortCharts = function () {
                cs.labels.forEach(function (label) {
                    cs.dims[label.label] = cs.cross.dimension(function (d) {
                        return d.labels[label.label] === undefined ? 'UnDef' : d.labels[label.label];
                    });
                    cs.grps[label.label] = cs.dims[label.label].group();

                    if (label.type === 'string' || label.type === 'object') {
                        cs.charts.push(_pieChart(cs.dims[label.label], cs.grps[label.label],
                            '#cohort-chart-' + label.ids));
                    } else if (label.type === 'number') {
                        var max = cs.dims[label.label].top(1)[0].labels[label.label];
                        var min = cs.dims[label.label].bottom(1)[0].labels[label.label];
                        cs.charts.push(_barChart(cs.dims[label.label], cs.grps[label.label],
                            '#cohort-chart-' + label.ids, min, max, label.name));
                    }
                });
            };

            /**
             * Return the values for the current selection in cohort
             * @returns {{selected: (*|{returns the sum total of matching records, observes all dimension's filters}), total: *}}
             */
            chartService.getSelectionValues = function () {
                return {
                    selected:cs.cross.groupAll().value(),
                    total:cs.cross.size()
                };
            };

            /**
             * ChartService
             */
            return chartService;
        }]);
