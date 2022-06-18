# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


class Covid19AnalysisPage(http.Controller):
    # a name reflection to deal with some differences of names between loaded data and map data
    name_dict = {
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
        "Macao": "澳门",
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

    # response to the request of getting data
    @http.route('/covid19_analysis/data/map', type='json', auth='user')
    def map_data(self, **kwargs):
        data = dict()
        _map1_data = self._map1_data()
        _map2_data = self._map2_data()
        _map1_china_data = self._map1_china_data()
        _map2_china_data = self._map2_china_data()
        # World data
        data['map1'] = _map1_data
        data['map2'] = _map2_data
        # China data
        data['map1_china'] = _map1_china_data
        data['map2_china'] = _map2_china_data
        return data

    # World data
    @staticmethod
    def _map1_data():
        objs = request.env['covid19.data'].search([])
        pre_data = dict()
        data = list()
        for obj in objs:
            if obj.country_region == "Mainland China":
                country_region = "China"
            elif obj.country_region == "US":
                country_region = "United States"
            elif obj.country_region == "South Korea":
                country_region = "Korea"
            else:
                country_region = obj.country_region
            if country_region not in pre_data:
                pre_data[country_region] = {
                    'confirmed': obj.confirmed,
                    'death': obj.death,
                    'recovered': obj.recovered
                }
            else:
                pre_data[country_region]['confirmed'] += obj.confirmed
                pre_data[country_region]['death'] += obj.death
                pre_data[country_region]['recovered'] += obj.recovered
        for key in pre_data.keys():
            data.append({
                'name': key,
                'value': {
                    'confirmed': pre_data[key]['confirmed'],
                    'recovered': pre_data[key]['recovered'],
                    'death': pre_data[key]['death'],
                }
            })
        return data

    @staticmethod
    def _map2_data():
        objs = request.env['covid19.data'].search([])
        pre_data = dict()
        data = list()
        for obj in objs:
            if obj.observation_date not in pre_data:
                pre_data[obj.observation_date] = {
                    'confirmed': obj.confirmed,
                    'death': obj.death,
                    'recovered': obj.recovered
                }
            else:
                pre_data[obj.observation_date]['confirmed'] += obj.confirmed
                pre_data[obj.observation_date]['death'] += obj.death
                pre_data[obj.observation_date]['recovered'] += obj.recovered
        for key in pre_data.keys():
            data.append({
                'time': key,
                'value': {
                    'confirmed': pre_data[key]['confirmed'],
                    'recovered': pre_data[key]['recovered'],
                    'death': pre_data[key]['death'],
                }
            })
        return data

    # China data
    @staticmethod
    def _map1_china_data():
        objs = request.env['covid19.data'].search([('country_region', '=', 'Mainland China')])
        pre_data = dict()
        data = list()
        for obj in objs:
            if obj.province_state not in pre_data:
                pre_data[obj.province_state] = {
                    'confirmed': obj.confirmed,
                    'death': obj.death,
                    'recovered': obj.recovered
                }
            else:
                pre_data[obj.province_state]['confirmed'] += obj.confirmed
                pre_data[obj.province_state]['death'] += obj.death
                pre_data[obj.province_state]['recovered'] += obj.recovered
        # include Taiwan data to China
        objs = (request.env['covid19.data'].search([('country_region', '=', 'Taiwan')]))
        for obj in objs:
            if obj.province_state not in pre_data:
                pre_data[obj.province_state] = {
                    'confirmed': obj.confirmed,
                    'death': obj.death,
                    'recovered': obj.recovered
                }
            else:
                pre_data[obj.province_state]['confirmed'] += obj.confirmed
                pre_data[obj.province_state]['death'] += obj.death
                pre_data[obj.province_state]['recovered'] += obj.recovered
        for key in pre_data.keys():
            data.append({
                'name': key if key not in Covid19AnalysisPage.name_dict else Covid19AnalysisPage.name_dict[key],
                'value': {
                    'confirmed': pre_data[key]['confirmed'],
                    'recovered': pre_data[key]['recovered'],
                    'death': pre_data[key]['death'],
                }
            })
        return data

    @staticmethod
    def _map2_china_data():
        objs = request.env['covid19.data'].search([('country_region', '=', 'Mainland China')])
        pre_data = dict()
        data = list()
        for obj in objs:
            if obj.observation_date not in pre_data:
                pre_data[obj.observation_date] = {
                    'confirmed': obj.confirmed,
                    'death': obj.death,
                    'recovered': obj.recovered
                }
            else:
                pre_data[obj.observation_date]['confirmed'] += obj.confirmed
                pre_data[obj.observation_date]['death'] += obj.death
                pre_data[obj.observation_date]['recovered'] += obj.recovered
        # include Taiwan data to China
        objs = (request.env['covid19.data'].search([('country_region', '=', 'Taiwan')]))
        for obj in objs:
            if obj.observation_date not in pre_data:
                pre_data[obj.observation_date] = {
                    'confirmed': obj.confirmed,
                    'death': obj.death,
                    'recovered': obj.recovered
                }
            else:
                pre_data[obj.observation_date]['confirmed'] += obj.confirmed
                pre_data[obj.observation_date]['death'] += obj.death
                pre_data[obj.observation_date]['recovered'] += obj.recovered
        for key in pre_data.keys():
            data.append({
                'time': key if key not in Covid19AnalysisPage.name_dict else Covid19AnalysisPage.name_dict[key],
                'value': {
                    'confirmed': pre_data[key]['confirmed'],
                    'recovered': pre_data[key]['recovered'],
                    'death': pre_data[key]['death'],
                }
            })
        return data
