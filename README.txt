index -> takes none

olympiads -> takes 

sorttriangle
sort_by
{#olympiad_list must contain [year, date, contestants, schools]#}

people -> takes

contestant_olympiad_list: stores [year, school_code, school, award, [task1_name, task2_name, ..., taskN_name], [task1_score, task2_score, ..., taskN_score], olymp_tot_score (often 800), tot_score_percent, rank, percentile, special_award]delegations_list: stores [year, school_code, school, role]
medal_count: [gold, silver, bronze]

results

scores_list: stores [id, userid, contestant_name, contestant_country, country_code, [q1_score, q2_score, ..., qN_score], award, special_awards, tot_percent]
year: year
task_ids = [taskid1, taskid2, ..., taskidN]
tot_score = total_score_across_all_qns
dp_list: stores [q1_dp, q2_dp, ..., qN_dp]
sort_by = score, school, contestant, rank (string)
sorttriangle = ▲/▼

olympiadsyear

school_count: number of schools
contestants: number of contestants
gold_count: number of golds
silver_count: number of silvers
bronze_count: number of bronzes 
hm_count: number of honourable mentions
gold_cutoff: str
silver_cutoff: str
bronze_cutoff: str
qns_max_score = "q1max + q2max + ... + qNmax = max_score" -> str
date: str

DATABASES

olympiads

	stores:

	- year (PK)
	- date
	- max_score
	- numqns 

scores

	stores: 
	- id (PK)
	- year (references olympiads)
	- userid (references people)
	- school_code (references schools)
	- q1
	- q2 (can leave as 0)
	- q3 (can leave as 0)
	...
	- q9 (can leave as 0)
	- q10 (can leave as 0)
	- time
	- award ('', 'hm', 'bronze', 'silver', 'gold')
	- special_award

delegations

	stores: 
	- id (PK)
	- year (references olympiads)
	- userid (references people)
	- role 
	- school_code (references schools)

	
schools

	- school_name
	- school_code (PK)
	
people

	- userid (PK)
	- name
	- codebreaker (if any)
	- codeforces (if any)
	
tasks 

	- year (references olympiads)
	- tasknum (1-indexed)
	- taskname
	- taskid (short name)
	- max_score


!! DO NOTE WHEN IMPORTING SCOREBOARD CSV!!

you can either use direct exports from codebreaker or CMS
and note that you can add two columns to the .csv file, "award" and "school_code"