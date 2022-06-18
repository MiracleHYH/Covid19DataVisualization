# -*- coding: utf-8 -*-

from odoo import models, fields, api


class Covid19Data(models.Model):
    _name = 'covid19.data'
    _description = 'covid19.data'

    # ObservationDate, Province / State, Country / Region, Last, Update, Confirmed, Deaths, Recovered
    observation_date = fields.Date(string="Observation Date")
    province_state = fields.Char(string="Province / State")
    country_region = fields.Char(string="Country / Region")
    last_update_time = fields.Datetime(string="Last Update")
    confirmed = fields.Integer(string="Confirmed", default=0)
    death = fields.Integer(string="Death", default=0)
    recovered = fields.Integer(string="Recovered", default=0)
