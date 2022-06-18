from datetime import datetime, timedelta
import pandas as pd

data = pd.read_csv("covid_19_data.csv")
for i in range(0, 560):
	gsc_time = datetime.strptime(data.loc[i, 'Last Update'], "%m/%d/%Y %H:%M")
	gsc_time = datetime.strftime(gsc_time, "%Y/%m/%d %H:%M")
	data.loc[i, 'Last Update'] = gsc_time
for i in range(560, 7617):
	utc_time = data.loc[i, 'Last Update']
	gsc_time = datetime.strptime(utc_time, "%Y-%m-%dT%H:%M:%S")+timedelta(hours=8)
	gsc_time = datetime.strftime(gsc_time, "%Y/%m/%d %H:%M")
	data.loc[i, 'Last Update'] = gsc_time
# for i in range(0, 7617):
# 	gsc_time = data.loc[i, 'Last Update']
# 	gsc_time = datetime.strftime(gsc_time, "%Y/%m/%d %H:%M")
# 	data.loc[i, 'Last Update'] = gsc_time
data.to_csv("covid_19_data_modified.csv", index=None)