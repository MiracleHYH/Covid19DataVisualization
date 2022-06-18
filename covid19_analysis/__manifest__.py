# -*- coding: utf-8 -*-
{
    'name': "covid19_analysis",
    'summary': """record and analyse information about covid-19""",
    'description': """record and analyse information about covid-19""",
    'author': "PARADOX404",
    'website': "yet to do",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Accounting',
    'version': '2.0',

    # any module necessary for this one to work correctly
    'depends': ['base', 'website'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/covid19_data_view.xml',  # data view and edit page
        'views/covid19_analysis_view.xml',  # data visualization page -- total
        'views/covid19_spread_view.xml',  # data visualization page -- spread history
        'views/top_menu_bar_view.xml',  # top menu bar to switch among data_page and data visualization page
    ],
    # only loaded in demonstration mode
    'demo': [
        # 'demo/demo.xml',
    ],

    'assets': {
        'web.assets_common': [
            # third part packages
            # 'covid19_analysis/static/src/js/jquery-3.6.0.min.js',
            'covid19_analysis/static/src/bootstrap-3.4.1-dist/css/bootstrap.min.css',
            # 'covid19_analysis/static/src/bootstrap-3.4.1-dist/css/bootstrap-theme.min.css',
            # 'covid19_analysis/static/src/bootstrap-3.4.1-dist/js/bootstrap.min.js',
            # 'covid19_analysis/static/src/bootstrap-3.4.1-dist/js/npm.js',
            # 'covid19_analysis/static/src/js/lodash.min.js',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/js/bootstrap.min.js',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/js/bootstrap.esm.min.js',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/js/bootstrap.bundle.min.js',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap.min.css',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap.rtl.min.css',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap-grid.min.css',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap-reboot.min.css',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap-reboot.rtl.min.css',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap-utilities.min.css',
            # 'covid19_analysis/static/src/bootstrap-5.1.3-dist/css/bootstrap-utilities.rtl.min.css',
            # 'covid19_analysis/static/src/bootstrap-datetimepicker-master/less/datetimepicker.less',
            # 'covid19_analysis/static/src/bootstrap-datetimepicker-master/js/bootstrap-datetimepicker.min.js',
            # 'covid19_analysis/static/src/bootstrap-datetimepicker-master/css/bootstrap-datetimepicker.min.css',
            # 'covid19_analysis/static/src/bootstrap-datetimepicker-master/js/locales/bootstrap-datetimepicker.zh-CN.js',
            'covid19_analysis/static/src/bootstrap-datepicker-1.9.0-dist/css/bootstrap-datepicker.min.css',
            'covid19_analysis/static/src/bootstrap-datepicker-1.9.0-dist/js/bootstrap-datepicker.min.js',
            'covid19_analysis/static/src/bootstrap-datepicker-1.9.0-dist/locales/bootstrap-datepicker.zh-CN.min.js'
        ],
        'web.assets_frontend': [
        ],
        'web.assets_backend': [
            'covid19_analysis/static/src/js/echarts/echarts.min.js',
            # 'covid19_analysis/static/src/js/echarts/extension/bmap.min.js',
            'covid19_analysis/static/src/js/echarts/extension/dataTool.min.js',
            # 'https://api.map.baidu.com/api?v=2.0&ak=<nGFMrXU55YHSDOcNxiRV40m7rhIPAkYa>',
            'covid19_analysis/static/src/js/covid19_analysis_page.js',  # QWeb Page JS for Analysis
            'covid19_analysis/static/src/js/covid19_spread_page.js',  # QWeb Page JS for Spread History
        ],
        'web.assets_qweb': [
            'covid19_analysis/static/src/xml/covid19_analysis_page.xml',  # QWeb Page XML for Analysis
            'covid19_analysis/static/src/xml/covid19_spread_page.xml',  # QWeb Page XML for Spread History
        ],
    },

    # 'installable': True,
    'auto_install': False,
    'application': True,
}
