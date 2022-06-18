odoo.define('covid19_spread.page', function (require) {
    var AbstractAction = require('web.AbstractAction');
    var core = require('web.core');

    var SpreadHistoryPage_self;
    var FIRST_DATE
    var LAST_DATE;
    var playInterval = null;

    // return a format date "yyyy-MM-dd"
    function get_format_date(date) {
        let res = String(date.getFullYear()) + '-';
        if (date.getMonth() + 1 < 10) res += '0';
        res += String(date.getMonth() + 1) + '-';
        if (date.getDate() < 10) res += '0';
        res += String(date.getDate())
        return res;
    }

    var SpreadHistoryPage = AbstractAction.extend({
        template: 'COVID-19 Spread History Page', // the template name defined in covid19_spread_page.xml

        // to register mouse click event on button
        events: {
            'click #btn-country-switch': 'country_switch',
            'click #btn-play': 'play',
            'click #btn-pause': 'pause',
        },

        // deal with switch country option
        country_switch: function (event) {
            let self = this;
            let btn_switch = $("#btn-country-switch-text");
            let calendar = $("#calendar");
            let now_date = get_format_date(calendar.datepicker("getDate"));
            let play_tag = false;
            if (playInterval != null) {
                self.pause();
                play_tag = true;
            }
            if (btn_switch.text() === "China") btn_switch.text("World");
            else btn_switch.text("China");
            // to call all charts to update data
            self._rpc({route: '/covid19_analysis/data/spread/map', params: {'end_date': now_date}})
                .then(function (data) {
                    if ($("#btn-country-switch-text").text() === 'China') {
                        self.counting_data_update(data.china.counting);
                        self.counting_map(data.china.counting)
                        self.distribution_map(data.china.map, true);
                        if (play_tag) self.play();
                    } else {
                        self.counting_data_update(data.world.counting);
                        self.counting_map(data.world.counting)
                        self.distribution_map(data.world.map, false);
                        if (play_tag) self.play();
                    }
                })
        },

        // start playing dynamic data from "now date" of the calendar and update data per seconds
        play: function (event) {
            $("#btn-play").addClass("hidden");
            $("#btn-pause").removeClass("hidden");
            playInterval = setInterval(this.go_to_next_day, 1000);
        },

        // stop playing
        pause: function (event) {
            $("#btn-pause").addClass("hidden");
            $("#btn-play").removeClass("hidden");
            clearInterval(playInterval);
            playInterval = null;
        },

        // update the calendar date to next day
        // call pause function when reach the end date of the database
        // redirect to the first date of the database when already reached the end date and still push the play button
        go_to_next_day: function () {
            let calendar = $('#calendar');
            let today = new Date(calendar.datepicker("getDate"));
            let str_today = get_format_date(today);
            if (str_today === LAST_DATE) calendar.datepicker('setDate', FIRST_DATE);
            else {
                let next_day = +today + 1000 * 60 * 60 * 24;
                next_day = new Date(next_day);
                calendar.datepicker("setDate", next_day);
                let str_next_day = get_format_date(next_day);
                if (str_next_day === LAST_DATE) SpreadHistoryPage_self.pause();
            }
        },

        // update the progress bar when date changed
        update_progress_bar: function () {
            let calendar = $('#calendar');
            let today = new Date(calendar.datepicker("getDate"));
            console.log(get_format_date(today));
            let duration = Math.floor((today - new Date(FIRST_DATE)) / (1000 * 60 * 60 * 24));
            let whole_duration = Math.floor((new Date(LAST_DATE) - new Date(FIRST_DATE)) / (1000 * 60 * 60 * 24));
            if (get_format_date(today) === LAST_DATE) duration = whole_duration;
            $("#progress-bar")
                .attr("aria-valuenow", (duration / whole_duration) * 100)
                .css('width', ((duration / whole_duration) * 100) + '%');
        },

        // init function
        start: function () {
            if (playInterval != null) clearInterval(playInterval);
            let self = this;
            SpreadHistoryPage_self = self;
            self._rpc({route: '/covid19_analysis/data/spread/init', params: {}})
                .then(function (data) {
                    FIRST_DATE = data.first_date;
                    LAST_DATE = data.last_date;
                    self.show_calendar(FIRST_DATE, LAST_DATE);
                    self._rpc({route: '/covid19_analysis/data/spread/map', params: {'end_date': FIRST_DATE}})
                        .then(function (data) {
                            if ($("#btn-country-switch-text").text() === 'China') {
                                self.counting_data_update(data.china.counting);
                                self.counting_map(data.china.counting)
                                self.distribution_map(data.china.map, true);
                            } else {
                                self.counting_data_update(data.world.counting);
                                self.counting_map(data.world.counting)
                                self.distribution_map(data.world.map, false);
                            }
                        })
                })
        },

        // to call bootstrap-datepicker.js to setup the calendar
        show_calendar: function (first_date, last_date) {
            let self = this;
            let calendar = $('#calendar');
            calendar.datepicker({
                format: "yyyy年-mm月-dd日",
                startDate: first_date,
                endDate: last_date,
                weekStart: 1,
                maxViewMode: 2,
                todayBtn: "linked",
                language: "zh-CN",
                orientation: "bottom right",
                calendarWeeks: true,
                autoclose: true,
                todayHighlight: true,
                defaultViewDate: {
                    year: first_date.year,
                    month: first_date.month,
                    day: first_date.day
                },
                keyboardNavigation: false,
            })
            calendar.datepicker("setDate", first_date);
            calendar.datepicker().on('changeDate', self.calendar_change_date_callback)
        },

        // the callback of the dateChange Event of the calendar
        // to call all charts to update to the new data
        calendar_change_date_callback: function (event) {
            let self = SpreadHistoryPage_self;
            let calendar = $('#calendar');
            let now_date = get_format_date(calendar.datepicker("getDate"));
            self.update_progress_bar();
            self._rpc({route: '/covid19_analysis/data/spread/map', params: {'end_date': now_date}})
                .then(function (data) {
                    if ($("#btn-country-switch-text").text() === 'China') {
                        if (data.china.err === 0) {
                            self.counting_data_update(data.china.counting);
                            self.counting_map(data.china.counting);
                            self.distribution_map(data.china.map, true);
                        } else {
                            if ($("#btn-play").hasClass("hidden")) self.pause();
                            console.log(data.china.err);
                        }
                    } else {
                        if (data.world.err === 0) {
                            self.counting_data_update(data.world.counting);
                            self.counting_map(data.world.counting)
                            self.distribution_map(data.world.map, false);
                        } else {
                            if ($("#btn-play").hasClass("hidden")) self.pause();
                            console.log(data.world.err);
                        }
                    }
                })
        },

        // update the counting data
        counting_data_update: function (data) {
            if (data.sum.confirmed.number <= 10000)
                $("#u_confirmed_number").text(data.sum.confirmed.number);
            else if (data.sum.confirmed.number <= 100000000)
                $("#u_confirmed_number").text((data.sum.confirmed.number / 10000).toFixed(1) + '万');
            else $("#u_confirmed_number").text((data.sum.confirmed.number / 100000000).toFixed(2) + '亿');
            if (data.sum.death.number <= 10000)
                $("#u_death_number").text(data.sum.death.number);
            else if (data.sum.death.number <= 100000000)
                $("#u_death_number").text((data.sum.death.number / 10000).toFixed(1) + '万');
            else $("#u_death_number").text((data.sum.death.number / 100000000).toFixed(2) + '亿');
            if (data.sum.recovered.number <= 10000)
                $("#u_recovered_number").text(data.sum.recovered.number);
            else if (data.sum.recovered.number <= 100000000)
                $("#u_recovered_number").text((data.sum.recovered.number / 10000).toFixed(1) + '万');
            else $("#u_recovered_number").text((data.sum.recovered.number / 100000000).toFixed(2) + '亿');
            if (data.today.confirmed.number <= 10000)
                $("#confirmed_number").text(data.sum.confirmed.number);
            else if (data.today.confirmed.number <= 100000000)
                $("#confirmed_number").text((data.today.confirmed.number / 10000).toFixed(1) + '万');
            else $("#confirmed_number").text((data.today.confirmed.number / 100000000).toFixed(2) + '亿');
            if (data.today.death.number <= 10000)
                $("#death_number").text(data.today.death.number);
            else if (data.today.death.number <= 100000000)
                $("#death_number").text((data.today.death.number / 10000).toFixed(1) + '万');
            else $("#death_number").text((data.today.death.number / 100000000).toFixed(2) + '亿');
            if (data.today.recovered.number <= 10000)
                $("#recovered_number").text(data.today.recovered.number);
            else if (data.today.recovered.number <= 100000000)
                $("#recovered_number").text((data.today.recovered.number / 10000).toFixed(1) + '万');
            else $("#recovered_number").text((data.today.recovered.number / 100000000).toFixed(2) + '亿');

            if (data.sum.confirmed.rate === 0) {
                $("#u_confirmed_rate_number").text("-");
                $("#u_confirmed_rate_icon_up").addClass("hidden");
                $("#u_confirmed_rate_icon_down").addClass("hidden");
            } else {
                $("#u_confirmed_rate_number").text((data.sum.confirmed.rate * 100).toFixed(4) + '%');
                if (data.sum.confirmed.rate > 0) {
                    $("#u_confirmed_rate_icon_up").removeClass("hidden");
                    $("#u_confirmed_rate_icon_down").addClass("hidden");
                } else {
                    $("#u_confirmed_rate_icon_up").addClass("hidden");
                    $("#u_confirmed_rate_icon_down").removeClass("hidden");
                }
            }
            if (data.sum.death.rate === 0) {
                $("#u_death_rate_number").text("-");
                $("#u_death_rate_icon_up").addClass("hidden");
                $("#u_death_rate_icon_down").addClass("hidden");
            } else {
                $("#u_death_rate_number").text((data.sum.death.rate * 100).toFixed(4) + '%');
                if (data.sum.death.rate > 0) {
                    $("#u_death_rate_icon_up").removeClass("hidden");
                    $("#u_death_rate_icon_down").addClass("hidden");
                }
            }
            if (data.sum.recovered.rate === 0) {
                $("#u_recovered_rate_number").text("-");
                $("#u_recovered_rate_icon_up").addClass("hidden");
                $("#u_recovered_rate_icon_down").addClass("hidden");
            } else {
                $("#u_recovered_rate_number").text((data.sum.recovered.rate * 100).toFixed(4) + '%');
                if (data.sum.death.rate > 0) {
                    $("#u_recovered_rate_icon_up").removeClass("hidden");
                    $("#u_recovered_rate_icon_down").addClass("hidden");
                } else {
                    $("#u_recovered_rate_icon_up").addClass("hidden");
                    $("#u_recovered_rate_icon_down").removeClass("hidden");
                }
            }
            if (data.today.confirmed.rate === 0) {
                $("#confirmed_rate_number").text("-");
                $("#confirmed_rate_icon_up").addClass("hidden");
                $("#confirmed_rate_icon_down").addClass("hidden");
            } else {
                $("#confirmed_rate_number").text((data.today.confirmed.rate * 100).toFixed(4) + '%');
                if (data.today.confirmed.rate > 0) {
                    $("#confirmed_rate_icon_up").removeClass("hidden");
                    $("#confirmed_rate_icon_down").addClass("hidden");
                } else {
                    $("#confirmed_rate_icon_up").addClass("hidden");
                    $("#confirmed_rate_icon_down").removeClass("hidden");
                }
            }
            if (data.today.death.rate === 0) {
                $("#death_rate_number").text("-");
                $("#death_rate_icon_up").addClass("hidden");
                $("#death_rate_icon_down").addClass("hidden");
            } else {
                $("#death_rate_number").text((data.today.death.rate * 100).toFixed(4) + '%');
                if (data.today.death.rate > 0) {
                    $("#death_rate_icon_up").removeClass("hidden");
                    $("#death_rate_icon_down").addClass("hidden");
                } else {
                    $("#death_rate_icon_up").addClass("hidden");
                    $("#death_rate_icon_down").removeClass("hidden");
                }
            }
            if (data.today.recovered.rate === 0) {
                $("#recovered_rate_number").text("-");
                $("#recovered_rate_icon_up").addClass("hidden");
                $("#recovered_rate_icon_down").addClass("hidden");
            } else {
                $("#recovered_rate_number").text((data.today.recovered.rate * 100).toFixed(4) + '%');
                if (data.today.recovered.rate > 0) {
                    $("#recovered_rate_icon_up").removeClass("hidden");
                    $("#recovered_rate_icon_down").addClass("hidden");
                } else {
                    $("#recovered_rate_icon_up").addClass("hidden");
                    $("#recovered_rate_icon_down").removeClass("hidden");
                }
            }
        },

        // update the counting map data
        counting_map: function (data) {
            let sum_chartDom = document.getElementById('up_to_now_chart');
            let today_chartDom = document.getElementById('today_chart');
            let sum_myChart = echarts.init(sum_chartDom);
            let today_myChart = echarts.init(today_chartDom);
            let sum_option;
            let today_option;

            sum_option = {
                tooltip: {
                    trigger: 'item'
                },
                series: [
                    {
                        name: '截至当日累计',
                        type: 'pie',
                        radius: '50%',
                        data: [
                            {value: data.sum.confirmed.number, name: '确诊'},
                            {value: data.sum.death.number, name: '死亡'},
                            {value: data.sum.recovered.number, name: '治愈'}
                        ],
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            today_option = {
                tooltip: {
                    trigger: 'item'
                },
                series: [
                    {
                        name: '当日新增',
                        type: 'pie',
                        radius: '50%',
                        data: [
                            {value: data.today.confirmed.number, name: '确诊'},
                            {value: data.today.death.number, name: '死亡'},
                            {value: data.today.recovered.number, name: '治愈'}
                        ],
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };

            sum_option && sum_myChart.setOption(sum_option);
            today_option && today_myChart.setOption(today_option);
        },

        // update the distribution map data
        distribution_map: function (data, is_china) {
            let map_json_url = '/covid19_analysis/static/src/json/echarts-map/json/';
            if (is_china) map_json_url += 'china.json';
            else map_json_url += 'world.json';

            let pieces;
            if (is_china) pieces = [
                {min: 10000000, max: 99999999, label: '>= 10000000', color: '#1a0805'},
                {min: 1000000, max: 9999999, label: '1000000 ~ 9999999', color: '#35140b'},
                {min: 100000, max: 999999, label: '100000 ~ 999999', color: '#581c0e'},
                {min: 10000, max: 99999, label: '10000 ~ 99999', color: '#8b3221'},
                {min: 1000, max: 9999, label: '1000 ~ 9999', color: '#e87050'},
                {min: 100, max: 999, label: '100 ~ 999', color: '#f3ada4'},
                {min: 10, max: 99, label: '10 ~ 99', color: '#edcac5'},
                {min: 1, max: 9, label: '1 ~ 9', color: '#eadcd8'},
            ];
            else pieces = [
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

            let title;
            if (is_china) title = 'China ';
            else title = 'World ';

            let option;
            let chartDom = document.getElementById('distribution_map');
            let distribution_myChart = echarts.init(chartDom);
            $.get(map_json_url, function (geoJson) {
                echarts.registerMap('world', geoJson);
                option = {
                    title: {
                        text: title + 'COVID-19 Dynamic Distribution Chart',
                        subtext: 'Source form: Digital China',
                        sublink: 'http://www.digitalchina.com/'
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
                            name: 'COVID-19 Dynamic Distribution Chart',
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
                        }
                    ]
                };
                distribution_myChart.clear();
                distribution_myChart.setOption(option);
            });
            option && distribution_myChart.setOption(option);
        },
    });

    core.action_registry.add('covid19_analysis.covid19_spread.page', SpreadHistoryPage);
})