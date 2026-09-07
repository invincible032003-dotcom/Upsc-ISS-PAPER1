#!/usr/bin/env python3
import json,sys,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d=json.load(open(os.path.join(ROOT,'build','extracted.json'),encoding='utf-8'))
year=int(sys.argv[1]); lo=int(sys.argv[2]); hi=int(sys.argv[3])
prev_ss=None
for r in d:
    if r['year']!=year or not (lo<=r['questionNumber']<=hi): continue
    print('### %d-Q%02d  [%s / %s]'%(r['year'],r['questionNumber'],r['unit'],r['topic']))
    if r['sharedStem'] and r['sharedStem']!=prev_ss:
        print('STEM-SHARED: '+r['sharedStem'])
    if r['sharedStem']: prev_ss=r['sharedStem']
    print('Q: '+r['stem'])
    for i,o in enumerate(r['options']):
        print('   (%s) %s'%('abcd'[i],o))
    print()
