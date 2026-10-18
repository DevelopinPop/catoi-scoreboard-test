from flask import Flask, render_template, redirect, request
import sqlite3, os, csv
from sqlite3 import Error

app = Flask(__name__)

db = "database.db"



@app.route('/')

def index():
    return render_template('pages/index.html', )

@app.route('/results/<year>')

def results(year):
    print(year)
    sort_by = request.args.get('sort',"score_asc").split("_")
    unofficial = int(request.args.get('unofficial',"0"))
    sort_by[1] = sort_by[1].upper()
    if sort_by[0] == 'school':
        sort_by[0] = 'scores.school_code'
    elif sort_by[0] == 'contestant':
        sort_by[0] = 'people.name'
    elif sort_by[0] == 'rank' or sort_by[0] == 'score':
        sort_by[0] = '1 - (scores.q1 + scores.q2 + scores.q3 + scores.q4 + scores.q5 + scores.q6 + scores.q7 + scores.q8 + scores.q9 + scores.q10)'
    else:
        sort_by[0] = '(1 - scores.q' + sort_by[0][-1] + ')'
    sorttriangle = "▲"
    if sort_by[1] == "ASC":
        sorttriangle = "▼"

    '''

scores_list: stores [id, userid, contestant_name, contestant_country, country_code, [q1_score, q2_score, ..., qN_score], award, special_awards]
year: year
task_ids = [taskid1, taskid2, ..., taskidN]
tot_score = total_score_across_all_qns


    '''

    task_ids = []
    scores_list = []
    sql = """
SELECT SUM(tasks.max_score), COUNT(*) FROM tasks WHERE tasks.year = ?
GROUP BY tasks.year;
"""
    sql2 = """
SELECT tasks.tasknum, tasks.taskname,tasks.taskid FROM tasks WHERE tasks.year = ?
ORDER BY tasks.tasknum;
"""
    sql3 = """
SELECT scores.id, scores.userid, people.name, schools.school_name, scores.school_code, scores.award, scores.special_award, scores.q1, scores.q2, scores.q3, scores.q4, scores.q5, scores.q6, scores.q7, scores.q8, scores.q9, scores.q10, scores.official
FROM scores
JOIN schools ON scores.school_code = schools.school_code
JOIN people ON scores.userid = people.userid
WHERE scores.year == ? """ + ["AND scores.official = 1", ""][int(unofficial)] + """
ORDER BY """ + sort_by[0] + """ """+sort_by[1]+""", (scores.id) """+sort_by[1]+""";
"""
    sql4 = """
SELECT max(tasks.dp) FROM tasks
WHERE tasks.year == ?
"""
    sql5 = """
SELECT tasks.tasknum, tasks.dp FROM tasks
WHERE tasks.year == ?
ORDER BY tasks.tasknum
    """

    conn = sqlite3.connect(db)
    res = conn.execute(sql,(year,)).fetchone()
    tot_score = res[0]
    num_tasks = res[1]
    print(tot_score, num_tasks)
    res = conn.execute(sql2,(year,)).fetchall()
    max_dp = conn.execute(sql4,(year,)).fetchall()[0][0]
    for task in res:
        task_ids += [task[2]]
    res = conn.execute(sql3,(year,)).fetchall()
    for user in res:
        print(user)
        user = list(user)
        if not user[6]:
            user[6] = ""
        scores_list += [list(user[:5]) + [list(map(float,user[7:7+num_tasks]))] + list(user[5:7]) + [f"{sum(user[7:7+num_tasks]):.{max_dp}f}"] + [int(user[-1])]]

        

        print(list(user[:5]) + [list(user[7:7+num_tasks])] + list(user[5:7]))
    res = conn.execute(sql5,(year,)).fetchall()
    dp_list = [i[1] for i in res]
    print(dp_list)
    conn.close()
    
    print(scores_list)


    return render_template('results.html', unofficial=unofficial, year=year, tot_score=tot_score, task_ids=task_ids, scores_list=scores_list, dp_list = dp_list, sort_by = request.args.get('sort',"score_asc").split("_")[0], sorttriangle = sorttriangle)


@app.route('/olympiads/<year>')
@app.route('/olympiads/')
def olympiads(year=None):
    sort_by = request.args.get('sort',"year_desc").split("_")
    sort_by[1] = sort_by[1].upper()
    if sort_by[0] == 'year':
        sort_by[0] = 'olympiads.year'
    elif sort_by[0] == 'contestants':
        sort_by[0] = 'COUNT(scores.id)'
    elif sort_by[0] == 'schools':
        sort_by[0] = 'COUNT(DISTINCT scores.school_code)'
    sorttriangle = "▲"
    if sort_by[1] != "ASC":
        sorttriangle = "▼"
    if year == None:
        conn = sqlite3.connect(db)
        olympiad_list = list(conn.execute("""SELECT olympiads.year, olympiads.date, COUNT(scores.id), COUNT(DISTINCT scores.school_code) FROM olympiads
LEFT JOIN scores ON olympiads.year = scores.year
GROUP BY olympiads.year
ORDER BY {} {}""".format(sort_by[0],sort_by[1])))
        
        print(request.args.get('sort',"year_desc").split("_")[0], sorttriangle)
        conn.close()
        return render_template('olympiads.html', olympiad_list=olympiad_list, sort_by=request.args.get('sort',"year_desc").split("_")[0], sorttriangle=sorttriangle)

    conn = sqlite3.connect(db)
    contest_archive = conn.execute("""SELECT archive FROM olympiads
WHERE olympiads.year = ?""",(year,)).fetchall()[0][0]
    school_count = conn.execute("""SELECT COUNT(*) FROM (
SELECT * FROM scores
WHERE scores.year = ? AND scores.official = 1
GROUP BY scores.school_code
)""",(year,)).fetchall()[0][0]
    
    school_unofficial_count = conn.execute("""SELECT COUNT(*) FROM (
SELECT * FROM scores
WHERE scores.year = ?
GROUP BY scores.school_code
)""",(year,)).fetchall()[0][0]
    contestants = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.official = 1""",(year,)).fetchall()[0][0]
    contestants_unofficial = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ?""",(year,)).fetchall()[0][0]
    gold_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'gold' AND scores.official = 1""",(year,)).fetchall()[0][0]
    silver_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'silver' AND scores.official = 1""",(year,)).fetchall()[0][0]
    bronze_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'bronze' AND scores.official = 1""",(year,)).fetchall()[0][0]
    gold_unofficial_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'gold'""",(year,)).fetchall()[0][0]
    silver_unofficial_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'silver' """,(year,)).fetchall()[0][0]
    bronze_unofficial_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'bronze'""",(year,)).fetchall()[0][0]
    hm_count = conn.execute("""SELECT COUNT(*) FROM scores WHERE scores.year = ? AND scores.award = 'hm' AND scores.official = 1""",(year,)).fetchall()[0][0]
    dp_list = conn.execute("""SELECT tasknum, dp ,max_score FROM tasks WHERE tasks.year = ?""",(year,)).fetchall()
    date = conn.execute("""SELECT date FROM olympiads WHERE year = ?""",(year,)).fetchall()[0][0]
    qns_max_score = ["" for _ in range(len(dp_list))]
    max_dp = 0
    print(gold_count, silver_count, bronze_count, school_count)
    for i in dp_list:
        if i[1] == 2:
            qns_max_score[i[0]-1] = "{:.2f}".format(i[2])
        elif i[1] == 1:
            qns_max_score[i[0]-1] = "{:.1f}".format(i[2])
        else:
            qns_max_score[i[0]-1] = "{:.0f}".format(i[2])
        max_dp = max(max_dp, i[1])
    print(qns_max_score)
    qns_max_score = " + ".join(qns_max_score) + " = " + ("{:." + str(max_dp) + "f}").format(sum(map(float,qns_max_score)))
    gold_cutoff = conn.execute("""SELECT min(scores.q1 + scores.q2 + scores.q3 + scores.q4 + scores.q5 + scores.q6 + scores.q7 + scores.q8 + scores.q9 + scores.q10) FROM scores WHERE scores.year = ? AND scores.award = 'gold' AND scores.official = 1""",(year,)).fetchall()[0][0]
    silver_cutoff = conn.execute("""SELECT min(scores.q1 + scores.q2 + scores.q3 + scores.q4 + scores.q5 + scores.q6 + scores.q7 + scores.q8 + scores.q9 + scores.q10) FROM scores WHERE scores.year = ? AND scores.award = 'silver' AND scores.official = 1""",(year,)).fetchall()[0][0]
    bronze_cutoff = conn.execute("""SELECT min(scores.q1 + scores.q2 + scores.q3 + scores.q4 + scores.q5 + scores.q6 + scores.q7 + scores.q8 + scores.q9 + scores.q10) FROM scores WHERE (scores.year = ? AND scores.award = 'bronze' AND scores.official = 1)""",(year,)).fetchall()[0][0]

    print(gold_cutoff,silver_cutoff,bronze_cutoff)

    gold_cutoff = ("{:." + str(max_dp) + "f}").format(gold_cutoff)
    silver_cutoff = ("{:." + str(max_dp) + "f}").format(silver_cutoff)
    bronze_cutoff = ("{:." + str(max_dp) + "f}").format(bronze_cutoff)
    conn.close()
    
    return render_template('olympiadsyear.html', school_unofficial_count=school_unofficial_count, contest_archive=contest_archive, contestants_unofficial=contestants_unofficial, gold_unofficial_count=gold_unofficial_count, silver_unofficial_count=silver_unofficial_count, bronze_unofficial_count=bronze_unofficial_count, date=date, year=year, qns_max_score=qns_max_score, bronze_cutoff=bronze_cutoff, silver_cutoff=silver_cutoff, gold_cutoff=gold_cutoff, hm_count=hm_count, bronze_count=bronze_count, school_count=school_count, silver_count=silver_count, gold_count=gold_count, contestants=contestants)

@app.route('/people/<userid>')
def people(year=None):
    pass

@app.route('/tasks/<year>')

def tasks(year=None):
    pass
    

if __name__=='__main__':
    app.run()
