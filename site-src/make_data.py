# -*- coding: utf-8 -*-
"""Usage: python3 make_data.py <repo> > data.json   (aggregate cluster counts only)"""
import csv, json, sys, os
repo = sys.argv[1]
def rd(p): return list(csv.DictReader(open(os.path.join(repo, p), encoding='utf-8')))
iv = [{'id': r['cluster_id'], 'n': r['cluster'], 't': int(r['theme_id'][1:]), 'e': int(r['code_entries']), 'p': int(r['distinct_participants']),
       'main': r['role_in_synthesis'] == 'Main cluster'} for r in rd('evidence/interview-clusters.csv')]
pr = []
for r in rd('evidence/probe-clusters.csv'):
    t = 0 if r['theme_id'].startswith('Method') else int(r['theme_id'][1:])
    pr.append({'id': r['cluster_id'], 'n': r['cluster'], 't': t, 'e': int(r['code_entries']),
               's': [int(r['probe_record_codes']), int(r['intro_interview_codes']), int(r['exit_interview_codes']), int(r['spot_map_codes'])]})
print(json.dumps({'iv': iv, 'pr': pr}, separators=(',', ':')))
