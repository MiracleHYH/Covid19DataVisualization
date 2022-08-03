odoo.define('covid19_analysis.page', function (require) {
    var AbstractAction = require('web.AbstractAction');
    var core = require('web.core');

    var cache_data;  // cache data to avoid frequently requests
    var data_type = 'confirmed';  // define map(1/2) data type(confirmed recovered death)
    var is_in_map = true;  // define map1 type, map:true, rank:false
    var is_china = false;  // define map(1/2) data source, china:true, world:false
    // var play_data;

    var AnalysisPage = AbstractAction.extend({
        template: 'COVID-19 Analysis Page',  // the template name defined in covid19_analysis_page.xml
        // to register mouse click event on button
        events: {
            'click #btn-map': 'show_map',
            'click #btn-rank': 'show_rank',
            'click #btn-confirmed': 'show_confirmed',
            'click #btn-recovered': 'show_recovered',
            'click #btn-death': 'show_death',
            'click #btn-total': 'show_total',
            'click #btn-daily': 'show_daily',
            'click #btn-switch': 'switch_map',
            'click #btn-play': 'play',
            'click #btn-stop': 'stop',
            'click #btn-to_end': 'to_end'
        },

        // switch to map viewdi
        show_map: function (event) {
            if (is_in_map) return;
            is_in_map = true;
            $("#btn-rank").removeClass("disabled");
            $("#btn-map").addClass("disabled");
            this._show_map(cache_data);
        },

        // switch to rank view
        show_rank: function (event) {
            if (!is_in_map) return;
            is_in_map = false;
            $("#btn-map").removeClass("disabled");
            $("#btn-rank").addClass("disabled");
            this._show_rank(cache_data);
        },

        // switch to show confirmed number in map/rank graph
        show_confirmed: function (event) {
            if (data_type === 'confirmed')
                return;
            else if (data_type === 'recovered')
                $("#btn-recovered").removeClass("active");
            else $("#btn-death").removeClass("active");
            $("#btn-confirmed").addClass("active");
            data_type = 'confirmed';
            if (is_in_map) this._show_map(cache_data);
            else this._show_rank(cache_data)
        },

        // switch to show recovered number in map/rank graph
        show_recovered: function (event) {
            if (data_type === 'recovered')
                return;
            else if (data_type === 'confirmed')
                $("#btn-confirmed").removeClass("active");
            else $("#btn-death").removeClass("active");
            $("#btn-recovered").addClass("active");
            data_type = 'recovered';
            if (is_in_map) this._show_map(cache_data);
            else this._show_rank(cache_data);
        },

        // switch to show death number in map/rank graph
        show_death: function (event) {
            if (data_type === 'death')
                return;
            else if (data_type === 'recovered')
                $("#btn-recovered").removeClass("active");
            else $("#btn-confirmed").removeClass("active");
            $("#btn-death").addClass("active");
            data_type = 'death';
            if (is_in_map) this._show_map(cache_data);
            else this._show_rank(cache_data);
        },

        // switch to show total number in line graph
        show_total: function (event) {
            let btn_total = $("#btn-total");
            if (btn_total.hasClass("active"))
                return;
            $("#btn-daily").removeClass("active");
            btn_total.addClass("active");
            this._show_line_graph_total(cache_data);
        },

        // switch to show daily number in line graph
        show_daily: function (event) {
            let btn_daily = $("#btn-daily");
            if (btn_daily.hasClass("active"))
                return;
            $("#btn-total").removeClass("active");
            btn_daily.addClass("active");
            this._show_line_graph_daily(cache_data);
        },

        // switch between China Mode an World Mode
        switch_map: function (event) {
            is_china = !is_china;
            if (is_china) $("#btn-switch-text").text("Switch to World");
            else $("#btn-switch-text").text("Switch to China");

            if (is_in_map) this._show_map(cache_data);
            else this._show_rank(cache_data);

            if ($("#btn-total").hasClass("active")) this._show_line_graph_total(cache_data);
            else this._show_line_graph_daily(cache_data);
        },

        // yet to be figured out to display dynamic data changes
        play: function (event) {
            $("#btn-play").addClass("hidden");
            $("#btn-stop").removeClass("hidden");
            $("#btn-to_end").removeClass("disabled");
        },
        stop: function (event) {
            $("#btn-stop").addClass("hidden");
            $("#btn-play").removeClass("hidden");
        },
        to_end: function (event) {
            $("#btn-stop").addClass("hidden");
            $("#btn-play").removeClass("hidden");
            $("#btn-to_end").addClass("disabled");

            if (is_in_map) this.show_map(cache_data);
            else this._show_rank(cache_data);

            if ($("#btn-total").hasClass("active")) this._show_line_graph_total(cache_data);
            else this._show_line_graph_daily(cache_data);
        },

        // init function
        start: function () {
            var self = this;
            var data;
            this._rpc({route: '/covid19_analysis/data/map', params: {}})
                .then(function (data) {
                    cache_data = data;
                    data_type = "confirmed";
                    self._show_map(data);
                    self._show_line_graph_total(data);
                })
        },

        // to show map view
        _show_map: function (data) {
            if (is_china) data = $.extend(true, [], data.map1_china);
            else data = $.extend(true, [], data.map1);

            if (data_type === 'confirmed')
                data = data.map(function (item) {
                    return {'name': item.name, 'value': item.value.confirmed}
                });
            else if (data_type === 'recovered')
                data = data.map(function (item) {
                    return {'name': item.name, 'value': item.value.recovered}
                });
            else data = data.map(function (item) {
                    return {'name': item.name, 'value': item.value.death}
                });

            var map_json_url = '/covid19_analysis/static/src/json/echarts-map/json/';
            if (is_china) map_json_url += 'china.json';
            else map_json_url += 'world.json';
            var pieces;
            if (data_type === 'death')
                pieces = [
                    {min: 100000000, max: 999999999, label: '>= 100000000', color: '#270b07'},
                    {min: 10000000, max: 99999999, label: '10000000 ~ 99999999', color: '#562113'},
                    {min: 1000000, max: 9999999, label: '1000000 ~ 9999999', color: '#8b2c17'},
                    {min: 100000, max: 999999, label: '100000 ~ 999999', color: '#b24731'},
                    {min: 10000, max: 99999, label: '10000 ~ 99999', color: '#e87050'},
                    {min: 1000, max: 9999, label: '1000 ~ 9999', color: '#ef7567'},
                    {min: 100, max: 999, label: '100 ~ 999', color: '#f3ada4'},
                    {min: 10, max: 99, label: '10 ~ 99', color: '#edcac5'},
                    {min: 1, max: 9, label: '1 ~ 9', color: '#eadcd8'},
                ];
            else if (data_type === 'recovered')
                pieces = [
                    {min: 100000000, max: 999999999, label: '>= 100000000', color: '#1e3c02'},
                    {min: 10000000, max: 99999999, label: '10000000 ~ 99999999', color: '#336205'},
                    {min: 1000000, max: 9999999, label: '1000000 ~ 9999999', color: '#49800b'},
                    {min: 100000, max: 999999, label: '100000 ~ 999999', color: '#6abc1f'},
                    {min: 10000, max: 99999, label: '10000 ~ 99999', color: '#91ea3d'},
                    {min: 1000, max: 9999, label: '1000 ~ 9999', color: '#a3d75c'},
                    {min: 100, max: 999, label: '100 ~ 999', color: '#c2ea98'},
                    {min: 10, max: 99, label: '10 ~ 99', color: '#cce3b2'},
                    {min: 1, max: 9, label: '1 ~ 9', color: '#e1ead8'},
                ];
            else
                pieces = [
                    {min: 100000000, max: 999999999, label: '>= 100000000', color: '#000000'},
                    {min: 10000000, max: 99999999, label: '10000000 ~ 99999999', color: '#04313f'},
                    {min: 1000000, max: 9999999, label: '1000000 ~ 9999999', color: '#044254'},
                    {min: 100000, max: 999999, label: '100000 ~ 999999', color: '#055f78'},
                    {min: 10000, max: 99999, label: '10000 ~ 99999', color: '#008fb2'},
                    {min: 1000, max: 9999, label: '1000 ~ 9999', color: '#2ebce1'},
                    {min: 100, max: 999, label: '100 ~ 999', color: '#68c9e6'},
                    {min: 10, max: 99, label: '10 ~ 99', color: '#abdaea'},
                    {min: 1, max: 9, label: '1 ~ 9', color: '#d8e6ea'},
                ];

            let title;
            if (is_china) title = 'China ';
            else title = 'World ';

            var option;
            var chartDom = document.getElementById('analysis_map');
            var myChart = echarts.init(chartDom);
            myChart.showLoading();
            $.get(map_json_url, function (geoJson) {
                myChart.hideLoading();
                echarts.registerMap('world', geoJson);
                option = {
                    title: {
                        text: title + 'COVID-19 Distribution Chart',
                        subtext: 'Source form: ***',
                        sublink: '***'
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: '{b}<br/>{c}'
                    },
                    visualMap: {
                        type: 'piecewise',
                        pieces: pieces,
                        color: ['#E0022B', '#E09107', '#A3E00B']
                    },
                    series: [
                        {
                            name: 'COVID-19 Analysis',
                            type: 'map',
                            map: 'world',
                            label: {
                                show: false
                            },
                            data: data,
                            animationDurationUpdate: 2000,
                            universalTransition: true,
                            roma: true,
                            scaleLimit: {
                                min: 1,
                                max: 15,
                            },
                            // 自定义名称映射
                            // nameMap: {
                            // }
                        }
                    ]
                };
                myChart.clear();
                myChart.setOption(option);
            });
            option && myChart.setOption(option);
        },

        // to show rank view
        _show_rank: function (data) {
            if (is_china) data = $.extend(true, [], data.map1_china);
            else data = $.extend(true, [], data.map1);

            var color;
            if (data_type === 'confirmed') {
                data = data.map(function (item) {
                    return {'name': item.name, 'value': item.value.confirmed}
                });
                color = '#094479'
            } else if (data_type === 'recovered') {
                data = data.map(function (item) {
                    return {'name': item.name, 'value': item.value.recovered}
                });
                color = '#14d038'
            } else {
                data = data.map(function (item) {
                    return {'name': item.name, 'value': item.value.death}
                });
                color = '#9e1c09'
            }
            data = data.sort(function (a, b) {
                return a.value - b.value;
            });

            let title;
            if (is_china) title = 'China ';
            else title = 'World ';

            var chartDom = document.getElementById('analysis_map');
            var myChart = echarts.init(chartDom);
            var option;
            option = {
                title: {
                    text: title + 'COVID-19 ' + data_type + ' Rank',
                    subtext: 'Source form: ***',
                    sublink: '***'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                color: color,
                xAxis: {
                    type: 'value'
                },
                yAxis: {
                    type: 'category',
                    axisLabel: {
                        rotate: 30
                    },
                    data: (data.slice(data.length - 10, data.length)).map(function (item) {
                        return item.name;
                    })
                },
                animationDurationUpdate: 2000,
                series: {
                    title: 'World Analysis',
                    type: 'bar',
                    id: 'Confirmed',
                    barWidth: '80%',
                    data: (data.slice(data.length - 10, data.length)).map(function (item) {
                        return item.value;
                    }),
                    universalTransition: true,
                    label: {
                        show: true,
                        precision: 1,
                        position: 'right',
                        valueAnimation: true,
                        fontFamily: 'monospace'
                    },
                }
            };
            myChart.clear();
            option && myChart.setOption(option);
        },

        // to show total view
        _show_line_graph_total: function (data) {
            var chartDom = document.getElementById('dynamic_graph');
            var myChart = echarts.init(chartDom);
            var option;
            if (is_china) data = $.extend(true, [], data.map2_china);
            else data = $.extend(true, [], data.map2);
            for (let i = 1; i < data.length; ++i) {
                data[i].value.confirmed += data[i - 1].value.confirmed;
                data[i].value.recovered += data[i - 1].value.recovered;
                data[i].value.death += data[i - 1].value.death;
            }

            let title = 'COVID-19 Total Trend chart';
            if (is_china) title = 'China ' + title;
            else title = 'World ' + title;
            option = {
                title: {
                    text: title
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['Confirmed', 'Recovered', 'Death']
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    name: 'Date',
                    type: 'category',
                    splitLine: {
                        show: false
                    },
                    data: data.map(function (item) {
                        return item.time;
                    }),
                },
                yAxis: {
                    name: 'Number',
                    type: 'value',
                    boundaryGap: [0, '100%'],
                    splitLine: {
                        show: true,
                    }
                },
                series: [
                    {
                        name: 'Confirmed',
                        type: 'line',
                        // stack: 'Total',
                        color: '#094479',
                        data: data.map(function (item) {
                            return item.value.confirmed;
                        }),
                    },
                    {
                        name: 'Recovered',
                        type: 'line',
                        // stack: 'Total',
                        color: '#14d038',
                        data: data.map(function (item) {
                            return item.value.recovered;
                        }),
                    },
                    {
                        name: 'Death',
                        type: 'line',
                        // stack: 'Total',
                        color: '#9e1c09',
                        data: data.map(function (item) {
                            return item.value.death;
                        }),
                    }
                ]
            };
            myChart.clear();
            option && myChart.setOption(option);
        },

        // to show daily view
        _show_line_graph_daily: function (data) {
            var chartDom = document.getElementById('dynamic_graph');
            var myChart = echarts.init(chartDom);
            var option;
            if (is_china) data = $.extend(true, [], data.map2_china);
            else data = $.extend(true, [], data.map2);

            let title = 'COVID-19 Daily Count chart';
            if (is_china) title = 'China ' + title;
            else title = 'World ' + title;
            option = {
                title: {
                    text: title
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['Confirmed', 'Recovered', 'Death']
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    name: 'Date',
                    type: 'category',
                    splitLine: {
                        show: false
                    },
                    data: data.map(function (item) {
                        return item.time;
                    }),
                },
                yAxis: {
                    name: 'Number',
                    type: 'value',
                    boundaryGap: [0, '100%'],
                    splitLine: {
                        show: true,
                    }
                },
                series: [
                    {
                        name: 'Confirmed',
                        type: 'line',
                        color: '#094479',
                        // stack: 'Total',
                        data: data.map(function (item) {
                            return item.value.confirmed;
                        }),
                    },
                    {
                        name: 'Recovered',
                        type: 'line',
                        // stack: 'Total',
                        color: '#14d038',
                        data: data.map(function (item) {
                            return item.value.recovered;
                        }),
                    },
                    {
                        name: 'Death',
                        type: 'line',
                        // stack: 'Total',
                        color: '#9e1c09',
                        data: data.map(function (item) {
                            return item.value.death;
                        }),
                    }
                ]
            };
            myChart.clear();
            option && myChart.setOption(option);
        },
    });

    core.action_registry.add('covid19_analysis.covid19_analysis.page', AnalysisPage);
})
