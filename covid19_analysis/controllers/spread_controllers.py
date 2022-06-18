# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import datetime


class Covid19SpreadPage(http.Controller):
    # name reflection to deal with some differences of names between loaded data and map data
    china_name_dict = {
        "Shanghai": "上海",
        "Yunnan": "云南",
        "Inner Mongolia": "内蒙古",
        "Beijing": "北京",
        "Taiwan": "台湾",
        "Jilin": "吉林",
        "Sichuan": "四川",
        "Tianjin": "天津",
        "Ningxia": "宁夏",
        "Anhui": "安徽",
        "Shandong": "山东",
        "Shanxi": "山西",
        "Guangdong": "广东",
        "Guangxi": "广西",
        "Xinjiang": "新疆",
        "Jiangsu": "江苏",
        "Jiangxi": "江西",
        "Hebei": "河北",
        "Henan": "河南",
        "Zhejiang": "浙江",
        "Hainan": "海南",
        "Hubei": "湖北",
        "Hunan": "湖南",
        "Macau": "澳门",
        "Gansu": "甘肃",
        "Fujian": "福建",
        "Tibet": "西藏",
        "Guizhou": "贵州",
        "Liaoning": "辽宁",
        "Chongqing": "重庆",
        "Shaanxi": "陕西",
        "Qinghai": "青海",
        "Hong Kong": "香港",
        "Heilongjiang": "黑龙江",
    }

    world_name_dict = {
        "Mainland China": "China",
        "Taiwan": "China",
        "Macau": "China",
        "Hong Kong": "China",
        "US": "United States",
        "South Korea": "Korea",
        " Azerbaijan": "Azerbaijan",
        "Republic of the Congo": "Dem. Rep. Congo",
        "Central African Republic": "Central African Rep.",
        "Western Sahara": "W. Sahara",
        "UK": "United Kingdom",
        "South Sudan": "S. Sudan",
        "Laos": "Lao PDR",
        "Dominican Republic": "Dominican Rep."
    }
    world_country_list = list()

    # the duration time of a day
    day = datetime.timedelta(days=1)

    # date cache
    china_cache = dict()
    world_cache = dict()
    # record the first_date and last_date of the data item in database
    date_info_cache = dict()
    # to record the last update date of china and world
    china_last_update_date = None
    world_last_update_date = None

    # response of the init request
    @http.route('/covid19_analysis/data/spread/init', type='json', auth='user')
    def spread_data_init(self, **kwargs):
        if len(Covid19SpreadPage.date_info_cache) == 0:
            Covid19SpreadPage.init_cache()
        data = dict()
        data['first_date'] = Covid19SpreadPage.date_info_cache['first_date']
        data['last_date'] = Covid19SpreadPage.date_info_cache['last_date']
        return data

    # response of request date
    @http.route('/covid19_analysis/data/spread/map', type='json', auth='user')
    def spread_data_map(self, **kwargs):
        if len(Covid19SpreadPage.date_info_cache) == 0:
            Covid19SpreadPage.init_cache()
        data = dict()
        data['china'] = Covid19SpreadPage.china_data(kwargs['end_date'])
        data['world'] = Covid19SpreadPage.world_data(kwargs['end_date'])
        return data

    # init cache data
    @staticmethod
    def init_cache():
        objs = request.env['covid19.data'].search([])
        first_date = objs[0].observation_date
        last_date = objs[len(objs) - 1].observation_date
        Covid19SpreadPage.date_info_cache['first_date'] = first_date
        Covid19SpreadPage.date_info_cache['last_date'] = last_date
        now_date = first_date
        while now_date <= last_date:
            Covid19SpreadPage.china_cache[str(now_date)] = dict()
            Covid19SpreadPage.world_cache[str(now_date)] = dict()
            now_date += Covid19SpreadPage.day
        for obj in objs:
            country = obj.country_region
            if country in Covid19SpreadPage.world_name_dict:
                country = Covid19SpreadPage.world_name_dict[country]
            elif 'Congo' in country:
                Covid19SpreadPage.world_name_dict[country] = 'Congo'
                country = 'Congo'
            if country not in Covid19SpreadPage.world_country_list:
                Covid19SpreadPage.world_country_list.append(country)

    # return china_data for request date
    @staticmethod
    def china_data(end_date):
        if Covid19SpreadPage.china_last_update_date is None:
            first_date = Covid19SpreadPage.date_info_cache['first_date'] - Covid19SpreadPage.day
        else:
            first_date = Covid19SpreadPage.china_last_update_date
        last_date = end_date
        _last_date = datetime.date(*map(int, last_date.split('-')))

        if len(Covid19SpreadPage.china_cache[last_date]) == 0:
            Covid19SpreadPage.china_last_update_date = _last_date

            objs = request.env['covid19.data'].search([
                ('country_region', '=', 'Mainland China'),
                ('observation_date', '>', first_date),
                ('observation_date', '<=', last_date)
            ])
            objs += request.env['covid19.data'].search([
                ('country_region', '=', 'Taiwan'),
                ('observation_date', '>', first_date),
                ('observation_date', '<=', last_date)
            ])
            objs += request.env['covid19.data'].search([
                ('country_region', '=', 'Macau'),
                ('observation_date', '>', first_date),
                ('observation_date', '<=', last_date)
            ])
            objs += request.env['covid19.data'].search([
                ('country_region', '=', 'Hong Kong'),
                ('observation_date', '>', first_date),
                ('observation_date', '<=', last_date)
            ])

            index = 0
            now_date = first_date + Covid19SpreadPage.day
            while now_date <= _last_date:
                now_data = {'sum': dict(), 'today': dict()}
                b_now_date = str(now_date - Covid19SpreadPage.day)
                for city in Covid19SpreadPage.china_name_dict.values():
                    now_data['sum'][city] = {
                        'confirmed': Covid19SpreadPage.china_cache[b_now_date]['sum'][city]['confirmed']
                        if now_date > Covid19SpreadPage.date_info_cache['first_date'] else 0,
                        'death': Covid19SpreadPage.china_cache[b_now_date]['sum'][city]['death']
                        if now_date > Covid19SpreadPage.date_info_cache['first_date'] else 0,
                        'recovered': Covid19SpreadPage.china_cache[b_now_date]['sum'][city]['recovered']
                        if now_date > Covid19SpreadPage.date_info_cache['first_date'] else 0,
                    }
                    now_data['today'][city] = {
                        'confirmed': 0,
                        'death': 0,
                        'recovered': 0,
                    }
                Covid19SpreadPage.china_cache[str(now_date)] = now_data
                while index < len(objs) and now_date == objs[index].observation_date:
                    # if objs[index].province_state not in Covid19SpreadPage.china_name_dict:
                    #     return [objs[index].province_state, objs[index].country_region]
                    if objs[index].province_state not in Covid19SpreadPage.china_name_dict:
                        if objs[index].country_region not in Covid19SpreadPage.china_name_dict:
                            return {'err': [objs[index], index, len(objs)]}
                        else:
                            city = Covid19SpreadPage.china_name_dict[objs[index].country_region]
                    else:
                        city = Covid19SpreadPage.china_name_dict[objs[index].province_state]
                    Covid19SpreadPage.china_cache[str(now_date)]['sum'][city]['confirmed'] += objs[index].confirmed
                    Covid19SpreadPage.china_cache[str(now_date)]['sum'][city]['death'] += objs[index].death
                    Covid19SpreadPage.china_cache[str(now_date)]['sum'][city]['recovered'] += objs[index].recovered
                    Covid19SpreadPage.china_cache[str(now_date)]['today'][city]['confirmed'] += objs[index].confirmed
                    Covid19SpreadPage.china_cache[str(now_date)]['today'][city]['death'] += objs[index].death
                    Covid19SpreadPage.china_cache[str(now_date)]['today'][city]['recovered'] += objs[index].recovered
                    index += 1
                now_date += Covid19SpreadPage.day
        # return Covid19SpreadPage.china_cache[last_date]['sum']
        sum_today_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        sum_last_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        today_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        last_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        b_last_date = str(_last_date - Covid19SpreadPage.day)
        map_data = list()
        for city in Covid19SpreadPage.china_name_dict.values():
            map_data.append({'name': city, 'value': Covid19SpreadPage.china_cache[last_date]['sum'][city]['confirmed']})
            sum_today_cnt['confirmed'] += Covid19SpreadPage.china_cache[last_date]['sum'][city]['confirmed']
            sum_today_cnt['death'] += Covid19SpreadPage.china_cache[last_date]['sum'][city]['death']
            sum_today_cnt['recovered'] += Covid19SpreadPage.china_cache[last_date]['sum'][city]['recovered']
            today_cnt['confirmed'] += Covid19SpreadPage.china_cache[last_date]['today'][city]['confirmed']
            today_cnt['death'] += Covid19SpreadPage.china_cache[last_date]['today'][city]['death']
            today_cnt['recovered'] += Covid19SpreadPage.china_cache[last_date]['today'][city]['recovered']
            if _last_date > Covid19SpreadPage.date_info_cache['first_date']:
                sum_last_cnt['confirmed'] += Covid19SpreadPage.china_cache[b_last_date]['sum'][city]['confirmed']
                sum_last_cnt['death'] += Covid19SpreadPage.china_cache[b_last_date]['sum'][city]['death']
                sum_last_cnt['recovered'] += Covid19SpreadPage.china_cache[b_last_date]['sum'][city]['recovered']
                last_cnt['confirmed'] += Covid19SpreadPage.china_cache[b_last_date]['today'][city]['confirmed']
                last_cnt['death'] += Covid19SpreadPage.china_cache[b_last_date]['today'][city]['death']
                last_cnt['recovered'] += Covid19SpreadPage.china_cache[b_last_date]['today'][city]['recovered']

        data = {
            'counting': {
                'sum': {
                    'confirmed': {
                        'number': sum_today_cnt['confirmed'],
                        'rate': ((sum_today_cnt['confirmed'] - sum_last_cnt['confirmed']) / sum_last_cnt['confirmed'])
                        if sum_last_cnt['confirmed'] != 0 else 0
                    },
                    'death': {
                        'number': sum_today_cnt['death'],
                        'rate': ((sum_today_cnt['death'] - sum_last_cnt['death']) / sum_last_cnt['death'])
                        if sum_last_cnt['death'] != 0 else 0
                    },
                    'recovered': {
                        'number': sum_today_cnt['recovered'],
                        'rate': ((sum_today_cnt['recovered'] - sum_last_cnt['recovered']) / sum_last_cnt['recovered'])
                        if sum_last_cnt['recovered'] != 0 else 0
                    }
                },
                'today': {
                    'confirmed': {
                        'number': today_cnt['confirmed'],
                        'rate': ((today_cnt['confirmed'] - last_cnt['confirmed']) / last_cnt['confirmed'])
                        if last_cnt['confirmed'] != 0 else 0
                    },
                    'death': {
                        'number': today_cnt['death'],
                        'rate': ((today_cnt['death'] - last_cnt['death']) / last_cnt['death'])
                        if last_cnt['death'] != 0 else 0
                    },
                    'recovered': {
                        'number': today_cnt['recovered'],
                        'rate': ((today_cnt['recovered'] - last_cnt['recovered']) / last_cnt['recovered'])
                        if last_cnt['recovered'] != 0 else 0
                    }
                },
            },
            'map': map_data,
            'err': 0
        }
        return data

    # return world_data for request date
    @staticmethod
    def world_data(end_date):
        if Covid19SpreadPage.world_last_update_date is None:
            first_date = Covid19SpreadPage.date_info_cache['first_date'] - Covid19SpreadPage.day
        else:
            first_date = Covid19SpreadPage.world_last_update_date
        last_date = end_date
        _last_date = datetime.date(*map(int, last_date.split('-')))

        if len(Covid19SpreadPage.world_cache[last_date]) == 0:
            Covid19SpreadPage.world_last_update_date = _last_date

            objs = request.env['covid19.data'].search([
                ('observation_date', '>', first_date),
                ('observation_date', '<=', last_date)
            ])

            index = 0
            now_date = first_date + Covid19SpreadPage.day
            while now_date <= _last_date:
                now_data = {'sum': dict(), 'today': dict()}
                b_now_date = str(now_date - Covid19SpreadPage.day)
                for country in Covid19SpreadPage.world_country_list:
                    try:
                        now_data['sum'][country] = {
                            'confirmed': Covid19SpreadPage.world_cache[b_now_date]['sum'][country]['confirmed']
                            if now_date > Covid19SpreadPage.date_info_cache['first_date'] else 0,
                            'death': Covid19SpreadPage.world_cache[b_now_date]['sum'][country]['death']
                            if now_date > Covid19SpreadPage.date_info_cache['first_date'] else 0,
                            'recovered': Covid19SpreadPage.world_cache[b_now_date]['sum'][country]['recovered']
                            if now_date > Covid19SpreadPage.date_info_cache['first_date'] else 0,
                        }
                    except:
                        print(b_now_date, country)
                    now_data['today'][country] = {
                        'confirmed': 0,
                        'death': 0,
                        'recovered': 0,
                    }
                Covid19SpreadPage.world_cache[str(now_date)] = now_data
                while index < len(objs) and now_date == objs[index].observation_date:
                    if objs[index].country_region in Covid19SpreadPage.world_name_dict:
                        country = Covid19SpreadPage.world_name_dict[objs[index].country_region]
                    else:
                        country = objs[index].country_region
                    Covid19SpreadPage.world_cache[str(now_date)]['sum'][country]['confirmed'] += objs[index].confirmed
                    Covid19SpreadPage.world_cache[str(now_date)]['sum'][country]['death'] += objs[index].death
                    Covid19SpreadPage.world_cache[str(now_date)]['sum'][country]['recovered'] += objs[index].recovered
                    Covid19SpreadPage.world_cache[str(now_date)]['today'][country]['confirmed'] += objs[index].confirmed
                    Covid19SpreadPage.world_cache[str(now_date)]['today'][country]['death'] += objs[index].death
                    Covid19SpreadPage.world_cache[str(now_date)]['today'][country]['recovered'] += objs[index].recovered
                    index += 1
                now_date += Covid19SpreadPage.day
        # return Covid19SpreadPage.world_cache[last_date]['sum']
        sum_today_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        sum_last_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        today_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        last_cnt = {'confirmed': 0, 'death': 0, 'recovered': 0}
        b_last_date = str(_last_date - Covid19SpreadPage.day)
        map_data = list()
        for country in Covid19SpreadPage.world_country_list:
            try:
                map_data.append({
                    'name': country,
                    'value': Covid19SpreadPage.world_cache[last_date]['sum'][country]['confirmed']
                })
            except:
                print(country)
            sum_today_cnt['confirmed'] += Covid19SpreadPage.world_cache[last_date]['sum'][country]['confirmed']
            sum_today_cnt['death'] += Covid19SpreadPage.world_cache[last_date]['sum'][country]['death']
            sum_today_cnt['recovered'] += Covid19SpreadPage.world_cache[last_date]['sum'][country]['recovered']
            today_cnt['confirmed'] += Covid19SpreadPage.world_cache[last_date]['today'][country]['confirmed']
            today_cnt['death'] += Covid19SpreadPage.world_cache[last_date]['today'][country]['death']
            today_cnt['recovered'] += Covid19SpreadPage.world_cache[last_date]['today'][country]['recovered']
            if _last_date > Covid19SpreadPage.date_info_cache['first_date']:
                sum_last_cnt['confirmed'] += Covid19SpreadPage.world_cache[b_last_date]['sum'][country]['confirmed']
                sum_last_cnt['death'] += Covid19SpreadPage.world_cache[b_last_date]['sum'][country]['death']
                sum_last_cnt['recovered'] += Covid19SpreadPage.world_cache[b_last_date]['sum'][country]['recovered']
                last_cnt['confirmed'] += Covid19SpreadPage.world_cache[b_last_date]['today'][country]['confirmed']
                last_cnt['death'] += Covid19SpreadPage.world_cache[b_last_date]['today'][country]['death']
                last_cnt['recovered'] += Covid19SpreadPage.world_cache[b_last_date]['today'][country]['recovered']

        data = {
            'counting': {
                'sum': {
                    'confirmed': {
                        'number': sum_today_cnt['confirmed'],
                        'rate': ((sum_today_cnt['confirmed'] - sum_last_cnt['confirmed']) / sum_last_cnt['confirmed'])
                        if sum_last_cnt['confirmed'] != 0 else 0
                    },
                    'death': {
                        'number': sum_today_cnt['death'],
                        'rate': ((sum_today_cnt['death'] - sum_last_cnt['death']) / sum_last_cnt['death'])
                        if sum_last_cnt['death'] != 0 else 0
                    },
                    'recovered': {
                        'number': sum_today_cnt['recovered'],
                        'rate': ((sum_today_cnt['recovered'] - sum_last_cnt['recovered']) / sum_last_cnt['recovered'])
                        if sum_last_cnt['recovered'] != 0 else 0
                    }
                },
                'today': {
                    'confirmed': {
                        'number': today_cnt['confirmed'],
                        'rate': ((today_cnt['confirmed'] - last_cnt['confirmed']) / last_cnt['confirmed'])
                        if last_cnt['confirmed'] != 0 else 0
                    },
                    'death': {
                        'number': today_cnt['death'],
                        'rate': ((today_cnt['death'] - last_cnt['death']) / last_cnt['death'])
                        if last_cnt['death'] != 0 else 0
                    },
                    'recovered': {
                        'number': today_cnt['recovered'],
                        'rate': ((today_cnt['recovered'] - last_cnt['recovered']) / last_cnt['recovered'])
                        if last_cnt['recovered'] != 0 else 0
                    }
                },
            },
            'map': map_data,
            'err': 0
        }
        return data
