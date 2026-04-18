import { C } from './colors';

export const BACKEND         = 'https://homeowner-api-production.up.railway.app';
export const FREE_LIMIT      = 3;
export const PRO_LIMIT       = 100;

export const DEFAULT_PROFILE = { name:'', yearBuilt:'', homeType:'Single Family', sqft:'', zipCode:'' };
export const HOME_TYPES = ['Single Family','Condo / Apartment','Townhouse','Multi-Family','Mobile Home'];

export const SAFETY_QUESTIONS = [
  { id:'smoke',        category:'Fire Safety',          question:'When were smoke detectors last tested?',                          options:['Within 30 days','1–6 months ago','6–12 months ago','Over 1 year ago','Not sure / N/A'],                    weights:[100,80,50,10,30] },
  { id:'co',           category:'Fire Safety',          question:'Do you have carbon monoxide detectors?',                         options:['Yes, tested recently','Yes, not tested in a while','No','N/A (no gas appliances)'],                        weights:[100,60,0,100] },
  { id:'extinguisher', category:'Fire Safety',          question:'Do you have a fire extinguisher that\'s been inspected?',        options:['Yes, inspected within a year','Yes, never inspected','No'],                                                weights:[100,60,0] },
  { id:'airfilter',    category:'HVAC & Air Quality',   question:'When were HVAC air filters last replaced?',                      options:['Within 3 months','3–6 months ago','6–12 months ago','Over 1 year ago','N/A (no HVAC)'],                   weights:[100,80,40,10,100] },
  { id:'hvac',         category:'HVAC & Air Quality',   question:'When was your HVAC system last serviced by a professional?',     options:['Within 1 year','1–3 years ago','3–5 years ago','Never / Over 5 years','N/A'],                             weights:[100,70,40,10,100] },
  { id:'water_heater', category:'Plumbing & Water',     question:'How old is your water heater?',                                  options:['Under 5 years','5–10 years','10–15 years','Over 15 years','Not sure'],                                    weights:[100,85,50,10,50] },
  { id:'shutoff',      category:'Plumbing & Water',     question:'Do you know the location of your main water shutoff valve?',     options:['Yes','No'],                                                                                               weights:[100,0] },
  { id:'gfci',         category:'Electrical',           question:'Do you have GFCI outlets in bathrooms, kitchen & garage?',       options:['Yes, all areas','Some areas','No / Not sure'],                                                            weights:[100,60,10] },
  { id:'electrical',   category:'Electrical',           question:'When was your electrical panel last inspected?',                  options:['Within 5 years','5–10 years ago','Over 10 years ago','Never / Not sure'],                                weights:[100,70,30,20] },
  { id:'roof',         category:'Structure & Exterior', question:'When was your roof last professionally inspected?',               options:['Within 2 years','2–5 years ago','Over 5 years ago','Never / Not sure'],                                  weights:[100,75,40,25] },
  { id:'foundation',   category:'Structure & Exterior', question:'Have you noticed any cracks in walls, floors, or foundation?',   options:['No cracks noticed','Minor hairline cracks','Significant cracks','Not checked'],                          weights:[100,70,0,40] },
  { id:'locks',        category:'Security',             question:'Have you changed your locks since moving in?',                    options:['Yes, changed all locks','Yes, changed some locks','No, original locks','N/A (built new home)'],           weights:[100,70,0,100] },
  { id:'dryer_vent',   category:'Fire Safety',          question:'When was your dryer vent last cleaned?',                         options:['Within 1 year','1–2 years ago','Over 2 years ago','Never / Not sure','N/A (no dryer)'],                   weights:[100,70,30,10,100] },
  { id:'sump_pump',    category:'Plumbing & Water',     question:'Do you have a working sump pump (if applicable)?',               options:['Yes, tested recently','Yes, not tested recently','No sump pump needed','Not sure'],                       weights:[100,50,100,40] },
  { id:'windows_doors',category:'Structure & Exterior', question:'Are your windows and exterior doors properly sealed and weatherstripped?', options:['Yes, all sealed well','Some gaps or drafts','Significant gaps','Not checked'],              weights:[100,60,10,40] },
];

export const CATEGORIES = ['Fire Safety','HVAC & Air Quality','Plumbing & Water','Electrical','Structure & Exterior','Security'];

export const CATS = ['Interior','Exterior','Plumbing','Electrical','Landscaping','Other'];
export const PRI_ISSUES = ['Roof damage','Foundation cracks','Plumbing leak','Electrical issues','HVAC failure','Water damage / mold','Structural damage','Window/door issues','Insulation problems','Cosmetic repairs','Flooring damage','Appliance issues'];
export const PRI_CFG = {
  high:   { label:'Fix Now',      color:C.red,    bg:C.redL,    rec:'Safety or structural risk. Get quotes this week.',  icon:'⚠️' },
  medium: { label:'Plan Soon',    color:C.yellow, bg:C.yellowL, rec:'Address within 3–6 months. Get 2–3 quotes.',        icon:'🕐' },
  low:    { label:'Low Priority', color:C.green,  bg:C.greenL,  rec:'Safe to defer. Revisit in 6–12 months.',           icon:'✓' },
};

export const AWARDS = [
  { id:'first_scan',    pts:100, title:'Home Guardian',      desc:'Completed your first HomeDNA scan' },
  { id:'full_scan',     pts:250, title:'DNA Expert',         desc:'Answered all 15 safety questions' },
  { id:'first_repair',  pts:75,  title:'Handyman',           desc:'Logged your first repair' },
  { id:'five_repairs',  pts:200, title:'Repair Pro',         desc:'Logged 5 repairs' },
  { id:'first_project', pts:50,  title:'Project Starter',    desc:'Added your first budget project' },
  { id:'score_80',      pts:300, title:'Safety Champion',    desc:'Achieved a HomeDNA score of 80+' },
  { id:'score_60',      pts:150, title:'Safety Conscious',   desc:'Achieved a HomeDNA score of 60+' },
  { id:'profile_setup', pts:50,  title:'Home Owner',         desc:'Set up your home profile' },
  { id:'ten_timeline',  pts:200, title:'Historian',          desc:'10 events in your home timeline' },
];

export const COST_P = {'Flooring – hardwood':{low:6,high:12,u:'sqft'},'Flooring – laminate':{low:3,high:7,u:'sqft'},'Flooring – tile':{low:5,high:15,u:'sqft'},'Interior paint':{low:2,high:6,u:'sqft'},'Exterior paint':{low:1.5,high:4,u:'sqft'},'Roof replacement':{low:4,high:8,u:'sqft'},'Insulation – attic':{low:1,high:3,u:'sqft'},'Kitchen remodel (full)':{low:15000,high:50000,u:'flat'},'Bathroom remodel':{low:8000,high:25000,u:'flat'},'HVAC replacement':{low:5000,high:12000,u:'flat'},'Plumbing repair':{low:500,high:3000,u:'flat'},'Electrical panel upgrade':{low:1500,high:4000,u:'flat'},'Drywall repair':{low:300,high:1200,u:'flat'},'Window replacement (each)':{low:300,high:900,u:'flat'},'Deck / patio (new)':{low:4000,high:18000,u:'flat'},'Garage door replacement':{low:700,high:2500,u:'flat'},'Caulking / waterproofing':{low:300,high:2500,u:'flat'},'Foundation waterproofing':{low:3000,high:15000,u:'flat'},'Gutter repair / replacement':{low:300,high:1800,u:'flat'},'Siding replacement':{low:5000,high:18000,u:'flat'},'Fence installation':{low:1800,high:6000,u:'flat'},'Concrete / masonry repair':{low:500,high:5000,u:'flat'}};
export const ROI_D = {'Garage door replacement':{roi:193.9,ac:4513,av:8751},'Steel entry door':{roi:188.1,ac:2355,av:4430},'Manufactured stone veneer':{roi:153.2,ac:11287,av:17291},'Minor kitchen remodel':{roi:85.7,ac:27492,av:23556},'Deck addition (wood)':{roi:82.9,ac:17615,av:14596},'Siding replacement (vinyl)':{roi:80.2,ac:16576,av:13296},'Window replacement (vinyl)':{roi:68.5,ac:20091,av:13766},'Bathroom remodel (mid)':{roi:66.7,ac:24606,av:16413},'Major kitchen remodel':{roi:49.5,ac:77939,av:38769},'Roof replacement':{roi:61.1,ac:29136,av:17807}};

export const REGION_MULT = {
  '0':{ label:'Northeast',     mult:1.25 },
  '1':{ label:'Northeast',     mult:1.20 },
  '2':{ label:'Mid-Atlantic',  mult:1.15 },
  '3':{ label:'Southeast',     mult:0.90 },
  '4':{ label:'Midwest',       mult:0.95 },
  '5':{ label:'Midwest',       mult:0.92 },
  '6':{ label:'South Central', mult:0.88 },
  '7':{ label:'South',         mult:0.87 },
  '8':{ label:'Mountain West', mult:1.05 },
  '9':{ label:'Pacific',       mult:1.35 },
};

export const SEV = [{n:1,l:'Minor'},{n:2,l:'Mild'},{n:3,l:'Moderate'},{n:4,l:'Serious'},{n:5,l:'Critical'}];
export const PRI_COLOR = {high:C.red, medium:C.yellow, low:C.green};
export const PRI_BG    = {high:C.redL, medium:C.yellowL, low:C.greenL};
export const PRI_LABEL = {high:'Fix Now', medium:'Plan Soon', low:'Low Priority'};
export const SCR_LABEL = ['','Very Easy','Easy','Moderate','Hard','Hire a Pro'];
export const scColor   = v => v<=2 ? C.green : v<=3 ? C.yellow : C.red;
export const STARS     = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5-Math.round(r));

export const DIY_INFO = {
  'Flooring – hardwood':       { diff:4, pct:60, hrs:'2–4 days',  rec:'Hire a Pro',   why:'Requires a floor nailer, precise cuts, and proper acclimation time. Mistakes are expensive to reverse.' },
  'Flooring – laminate':       { diff:2, pct:55, hrs:'1–2 days',  rec:'DIY Friendly', why:'Click-lock systems are beginner-friendly. Most homeowners can handle this with a basic saw and patience.' },
  'Flooring – tile':           { diff:3, pct:50, hrs:'2–3 days',  rec:'Intermediate', why:'Doable with care — backer board, mortar, and grouting all matter. Uneven or cracked tiles are hard to fix later.' },
  'Interior paint':            { diff:1, pct:40, hrs:'1–3 days',  rec:'DIY Friendly', why:'The best DIY value in home improvement. Good prep (tape, prime) is the whole job.' },
  'Exterior paint':            { diff:3, pct:35, hrs:'3–5 days',  rec:'Intermediate', why:'Ladders, surface prep, and working around weather windows make this harder than interior work.' },
  'Roof replacement':          { diff:5, pct:40, hrs:'2–3 days',  rec:'Always Hire',  why:'High fall risk, permit required, and a bad installation causes catastrophic damage.' },
  'Insulation – attic':        { diff:2, pct:50, hrs:'1 day',     rec:'DIY Friendly', why:'Blown-in insulation machines can be rented. Good safety gear is essential. Big energy savings.' },
  'Kitchen remodel (full)':    { diff:5, pct:45, hrs:'4–8 weeks', rec:'Hire a Pro',   why:'Plumbing, electrical, and structural changes require permits and licensed trades.' },
  'Bathroom remodel':          { diff:4, pct:40, hrs:'1–3 weeks', rec:'Hire a Pro',   why:'Waterproofing errors cause hidden mold and structural damage.' },
  'HVAC replacement':          { diff:5, pct:35, hrs:'N/A',       rec:'Always Hire',  why:'Refrigerant handling requires EPA certification. Gas lines require a licensed tech.' },
  'Plumbing repair':           { diff:3, pct:30, hrs:'2–8 hrs',   rec:'Intermediate', why:'Faucets and toilets are DIY-able. Anything in walls or supply lines — hire out.' },
  'Electrical panel upgrade':  { diff:5, pct:25, hrs:'N/A',       rec:'Always Hire',  why:'Requires a licensed electrician and permit.' },
  'Drywall repair':            { diff:2, pct:55, hrs:'4–8 hrs',   rec:'DIY Friendly', why:'Patching and finishing takes a little practice but materials are cheap.' },
  'Window replacement (each)': { diff:3, pct:45, hrs:'2–4 hrs',   rec:'Intermediate', why:'Level installation, insulation, and weathersealing all affect performance.' },
  'Deck / patio (new)':        { diff:4, pct:50, hrs:'1–2 weeks', rec:'Intermediate', why:'Structural footings may need permits. Requires solid carpentry skills.' },
  'Garage door replacement':   { diff:3, pct:40, hrs:'4–6 hrs',   rec:'Intermediate', why:'Spring tensioning systems are dangerous — hire for springs. Panels and openers are manageable DIY.' },
};

export const ALL_SUGGESTIONS = [
  { project:'Garage door replacement',   roi:193.9, cost:[700,2500],    why:'#1 ROI project nationally. Major curb appeal boost and security upgrade.',        quick:true,  tags:['singlefamily','townhouse','multifamily'], minYear:0    },
  { project:'Steel entry door upgrade',  roi:188.1, cost:[1500,4000],   why:'Buyers notice the front door. High ROI, high security, instant curb appeal.',    quick:true,  tags:['all'],                                   minYear:0    },
  { project:'Manufactured stone veneer', roi:153.2, cost:[8000,15000],  why:'Dramatic curb appeal upgrade. One of the best exterior investments available.',   quick:false, tags:['singlefamily','townhouse'],              minYear:0    },
  { project:'Attic insulation',          roi:117.0, cost:[1500,4000],   why:'Huge energy savings + ROI. Best for homes with accessible attics.',              quick:true,  tags:['singlefamily','townhouse'],              minYear:0    },
  { project:'Landscaping & curb appeal', roi:100.0, cost:[500,5000],    why:'Well-kept landscaping returns 100%+ in perceived value. Buyers judge fast.',      quick:true,  tags:['singlefamily','townhouse','multifamily'], minYear:0    },
  { project:'Minor kitchen remodel',     roi:85.7,  cost:[10000,30000], why:'Kitchens sell homes. New cabinets, counters, and fixtures go a long way.',        quick:false, tags:['all'],                                   minYear:0    },
  { project:'Deck or patio addition',    roi:82.9,  cost:[8000,20000],  why:'Outdoor living space is highly valued. Strong ROI in most markets.',              quick:false, tags:['singlefamily','townhouse'],              minYear:0    },
  { project:'Siding replacement',        roi:80.2,  cost:[10000,20000], why:'Protects the home and dramatically improves appearance. Strong long-term value.',  quick:false, tags:['singlefamily','townhouse'],              minYear:1960 },
  { project:'Fresh exterior paint',      roi:80.0,  cost:[2000,6000],   why:'First impressions drive offers. Exterior paint is one of the cheapest ROI wins.',  quick:true,  tags:['singlefamily','townhouse'],              minYear:0    },
  { project:'Smart home upgrades',       roi:75.0,  cost:[500,3000],    why:'Thermostat, locks, lighting — buyers pay a premium for smart features.',           quick:true,  tags:['all'],                                   minYear:0    },
  { project:'Window replacement',        roi:68.5,  cost:[8000,20000],  why:'Energy efficiency + aesthetics. Especially impactful in older homes.',            quick:false, tags:['all'],                                   minYear:1990 },
  { project:'Bathroom refresh',          roi:66.7,  cost:[5000,15000],  why:'Updated bathrooms are a top buyer priority in every market.',                    quick:false, tags:['all'],                                   minYear:0    },
  { project:'Electrical panel upgrade',  roi:60.0,  cost:[3000,8000],   why:'Essential safety upgrade for older homes. Buyers and insurers expect modern panels.',quick:true,tags:['all'],                                   minYear:1980 },
  { project:'HVAC system replacement',   roi:55.0,  cost:[5000,12000],  why:'Buyers want newer HVAC. Major selling point and reduces inspection red flags.',     quick:false, tags:['singlefamily','townhouse','multifamily'], minYear:0    },
  { project:'Basement finishing',        roi:70.0,  cost:[15000,50000], why:'Adds livable square footage — one of the best ways to increase value in row homes.',quick:false,tags:['singlefamily','townhouse'],              minYear:0    },
  { project:'Fresh interior paint',      roi:100.0, cost:[1000,4000],   why:'Cheapest per-dollar value add. Neutral colors make spaces feel larger and newer.',  quick:true,  tags:['all'],                                   minYear:0    },
  { project:'Hardwood floor refinishing',roi:90.0,  cost:[1500,5000],   why:'Refinished hardwood is a major selling point. Much cheaper than replacement.',     quick:true,  tags:['all'],                                   minYear:1980 },
];
