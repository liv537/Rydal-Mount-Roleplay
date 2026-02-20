const STARTER_PEOPLE = [
  ['Joel Moffat','Student','Male','Straight',18],['Eleanor Bright','Student','Female','Bisexual',17],['Matthew Fielding','Student','Male','Straight',17],['Stephanie Winters','Student','Female','Bisexual',17],['Hope Townsend','Student','Female','Straight',17],['Lewis Radcliffe','Student','Male','Straight',17],['Daniel Clarke','Student','Male','Straight',16],['Joseph Campbell','Student','Male','Straight',16],['Zack Harding','Student','Male','Straight',16],['Lillia Moffat','Student','Female','Straight',16],['Maisie Sanderson','Student','Female','Bisexual',16],['Olivia Townsend','Student','Female','Straight',16],['Leah Whitaker','Student','Female','Lesbian',16],['Theo Clarke','Student','Male','Straight',16],['Cora Harrison','Student','Female','Straight',16],['Jesse Parker','Student','Nonbinary','Bisexual',16],['Teagan West','Student','Female','Straight',16],['Dean McConnell','Student','Male','Straight',15],['Imogen Moffat','Student','Female','Straight',15],['Isabelle (Issie) Bright','Student','Female','Bisexual',15],
  ['Miss Lorna Scarborough','Staff','Female','Straight',35],['Mr David Calloway','Staff','Male','Straight',38],['Mrs Elizabeth Harper','Staff','Female','Straight',43],['Mr Arthur Harding','Staff','Male','Straight',35],['Mr Evans','Staff','Male','Straight',36],['Mr Andrew Harrison','Staff','Male','Straight',41],['Miss Sofia Clarke','Staff','Female','Straight',37],['Mr James Fielding','Staff','Male','Straight',48]
];
const CALENDAR_EVENTS = [
 'June + January Formal Dances','March Sports Tryouts','House Sports Day (3rd Sat April)','Spring Gala + Concert (12th May)','Musical Auditions (Nov) & Performance (June)','November Ball + Mock Exams','Christmas Concert + Party (Late Dec)','Common Room Sleepovers/Parties','Quiz + Board Game Nights','Bowling / Ice Skating / Midnight Feasts'
];

let db = {};
let currentUser = 'default';
const $ = (id) => document.getElementById(id);

function loadDB(){ db = JSON.parse(localStorage.getItem('rmDramaDB') || '{}'); }
function saveDB(){ localStorage.setItem('rmDramaDB', JSON.stringify(db)); }
function userData(){
  if(!db[currentUser]) db[currentUser] = { people: structuredClone(STARTER_PEOPLE).map(toPerson), wheels:{}, history:[], gossip:[], chat:[], pregnancies:{} };
  return db[currentUser];
}
function toPerson([name,role,gender,sexuality,age]){ return { id: crypto.randomUUID(), name, role, gender, sexuality, age:Number(age)}; }
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function renderPeople(){
  const tbody = $('#peopleTable').querySelector('tbody'); tbody.innerHTML = '';
  const list = userData().people;
  list.forEach((p)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.name}</td><td>${p.role}</td><td>${p.gender}</td><td>${p.sexuality}</td><td>${p.age}</td><td><button data-del="${p.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-del]').forEach(b=>b.onclick=()=>{ userData().people = userData().people.filter(p=>p.id!==b.dataset.del); saveDB(); renderAll(); });

  const preg = $('#pregPerson'); preg.innerHTML='';
  userData().people.filter(p=>p.role==='Student' && p.gender==='Female').forEach(p=>{
    const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; preg.appendChild(o);
  });
}

function addHistory(text){ userData().history.unshift(`${new Date().toLocaleString()}: ${text}`); userData().history = userData().history.slice(0,250); }

function isCompatible(a,b){
  if (a.id===b.id || a.role!==b.role) return false; // blocks staff-student
  const likes = (person, other) => {
    if (person.sexuality==='Asexual') return false;
    if (person.sexuality==='Bisexual' || person.sexuality==='Questioning') return true;
    if (person.sexuality==='Straight') return person.gender!==other.gender;
    if (person.sexuality==='Gay' || person.sexuality==='Lesbian') return person.gender===other.gender;
    return true;
  };
  return likes(a,b) && likes(b,a);
}

function renderWheels(){
  const wrap = $('#wheelList'); wrap.innerHTML='';
  Object.entries(userData().wheels).forEach(([name,entries])=>{
    const box = document.createElement('div');
    box.innerHTML = `<strong>${name}</strong><br><small>${entries.length} entries</small><div class="grid two"><button data-spin="${name}">Spin</button><button data-remove="${name}">Delete</button></div><p id="result-${CSS.escape(name)}" class="result"></p>`;
    wrap.appendChild(box);
  });
  wrap.querySelectorAll('button[data-spin]').forEach(b=>b.onclick=()=>{
    const name=b.dataset.spin; const pick=rand(userData().wheels[name]);
    addHistory(`Wheel ${name}: ${pick}`); saveDB(); renderTimeline();
    b.parentElement.parentElement.querySelector('.result').textContent = `🎡 ${pick}`;
  });
  wrap.querySelectorAll('button[data-remove]').forEach(b=>b.onclick=()=>{ delete userData().wheels[b.dataset.remove]; saveDB(); renderWheels(); });
}

function renderTimeline(){ $('#timeline').innerHTML = userData().history.map(h=>`<li>${h}</li>`).join(''); }
function renderGossip(){ $('#gossipFeed').innerHTML = userData().gossip.map(g=>`<li>${g}</li>`).join(''); }
function renderChat(){ $('#chatLog').innerHTML = userData().chat.map(c=>`<div><strong>${c.sender}:</strong> ${c.msg}</div>`).join(''); }

function renderAll(){ renderPeople(); renderWheels(); renderTimeline(); renderGossip(); renderChat(); saveDB(); }

function init(){
  loadDB(); currentUser = localStorage.getItem('rmCurrentUser') || 'default';
  userData(); $('#userName').value = currentUser;

  $('#saveProfile').onclick=()=>{ currentUser=$('#userName').value.trim()||'default'; localStorage.setItem('rmCurrentUser', currentUser); userData(); renderAll(); };

  $('#importBulk').onclick=()=>{
    const lines = $('#bulkPeople').value.split('\n').map(l=>l.trim()).filter(Boolean);
    lines.forEach(line=>{ const [name,role,gender,sexuality,age] = line.split(',').map(v=>v?.trim()); if(name && role && gender){ userData().people.push({id:crypto.randomUUID(),name,role,gender,sexuality:sexuality||'Questioning',age:Number(age)||16}); } });
    addHistory(`Imported ${lines.length} people in bulk.`); renderAll();
  };

  $('#addPerson').onclick=()=>{
    const person = { id:crypto.randomUUID(), name:$('#pName').value.trim(), role:$('#pRole').value, gender:$('#pGender').value, sexuality:$('#pSex').value, age:Number($('#pAge').value)||16 };
    if(!person.name) return;
    userData().people.push(person); addHistory(`Added ${person.name}.`); renderAll();
  };

  $('#pickName').onclick=()=>{
    const role = $('#nameRoleFilter').value;
    const list = role==='Any' ? userData().people : userData().people.filter(p=>p.role===role);
    const pick = list.length? rand(list).name : 'No one available';
    $('#nameResult').textContent = `🎯 ${pick}`; addHistory(`Name picker: ${pick}`); renderTimeline();
  };

  $('#flipCoin').onclick=()=>{
    const scenario = $('#coinScenario').value.trim() || 'Scenario';
    const outcome = Math.random()<0.5 ? 'YES' : 'NO';
    $('#coinResult').textContent = `🪙 ${scenario}: ${outcome}`; addHistory(`Coin flip on "${scenario}": ${outcome}`); renderTimeline();
  };

  $('#matchmake').onclick=()=>{
    const people = userData().people;
    let attempts = 300, pair = null;
    while(attempts--){
      const a = rand(people), b = rand(people);
      if (a && b && isCompatible(a,b)) { pair = [a,b]; break; }
    }
    const txt = pair ? `💘 ${pair[0].name} + ${pair[1].name}` : 'No compatible pair found (current filters/sexualities may limit choices).';
    $('#matchResult').textContent = txt; addHistory(`Matchmaker: ${txt}`); renderTimeline();
  };

  const runPregnancy = ()=>{
    const id = $('#pregPerson').value; const person = userData().people.find(p=>p.id===id);
    if(!person) return;
    const positive = Math.random() < 0.35;
    $('#pregResult').textContent = `${person.name}: ${positive ? 'POSITIVE' : 'NEGATIVE'}`;
    $('#pregTracker').classList.toggle('hidden', !positive);
    if(!positive) delete userData().pregnancies[id];
    addHistory(`Pregnancy test for ${person.name}: ${positive ? 'Positive' : 'Negative'}`); renderTimeline(); saveDB();
  };
  $('#pregTest').onclick=runPregnancy; $('#pregReroll').onclick=runPregnancy;
  $('#savePregnancy').onclick=()=>{
    const id = $('#pregPerson').value; const person = userData().people.find(p=>p.id===id); if(!person) return;
    userData().pregnancies[id] = { gender:$('#babyGender').value, count:Number($('#babyCount').value), trimester:$('#trimester').value, bump:$('#bumpSize').value };
    addHistory(`Pregnancy tracker updated for ${person.name} (${userData().pregnancies[id].count} baby/babies).`); renderTimeline(); saveDB();
  };

  $('#saveWheel').onclick=()=>{
    const name=$('#wheelName').value.trim(); const entries=$('#wheelEntries').value.split('\n').map(v=>v.trim()).filter(Boolean);
    if(!name || !entries.length) return;
    userData().wheels[name] = entries; addHistory(`Saved custom wheel: ${name}`); renderAll();
  };

  $('#generateGossip').onclick=()=>{
    const text = $('#storyInput').value.toLowerCase();
    const spicy = ['kiss','date','love','crush','secret','fight','pregnan','cheat','text','dance'];
    const hit = spicy.filter(k=>text.includes(k));
    const templates = [
      `📱 Rumour: Someone was seen by Silverhowe tarn after curfew...`,
      `🫖 Whisper: A mystery note appeared in the South Tower common room.`,
      `🎭 Buzz: Drama staff suspect a performance dedication was secretly romantic.`,
      `💬 Group says: "We ALL know there is a crush triangle. Names soon?"`,
      `🪞 The halls are saying two friends are suddenly very protective of each other.`
    ];
    const responses = [
      'Reply option: “Spill names 👀”',
      'Reply option: “No way, receipts??”',
      'Reply option: “I knew it. I CALLED it.”',
      'Reply option: “Delete this before Miss Harper sees.”',
      'Reply option: “Meet in common room, 7pm. Full debrief.”'
    ];
    const g1 = rand(templates) + (hit.length ? ` (influenced by: ${hit.join(', ')})` : '');
    const g2 = rand(responses);
    userData().gossip.unshift(g1, g2); userData().gossip = userData().gossip.slice(0,40);
    addHistory(`Gossip generated from story input.`); renderGossip(); renderTimeline(); saveDB();
  };

  $('#randomNotif').onclick=()=>{
    const n = Math.random();
    const msg = n<0.5 ? '🔔 Phone ping: Wheel spin challenge issued in group chat.' : '🔔 Phone ping: Someone dared a pregnancy reroll test.';
    userData().gossip.unshift(msg); addHistory('Random phone notification fired.'); renderGossip(); renderTimeline(); saveDB();
  };

  $('#sendChat').onclick=()=>{
    const sender=$('#chatSender').value.trim()||'Anon'; const msg=$('#chatMsg').value.trim();
    if(!msg) return;
    userData().chat.push({sender,msg}); userData().chat = userData().chat.slice(-120); addHistory(`Chat: ${sender} sent a message.`);
    $('#chatMsg').value=''; renderChat(); renderTimeline(); saveDB();
  };

  $('#addCalendarEvents').onclick=()=>{ CALENDAR_EVENTS.forEach(e=>addHistory(`Calendar: ${e}`)); renderTimeline(); saveDB(); };

  $('#bulkPeople').value = STARTER_PEOPLE.map(p=>p.join(', ')).join('\n');
  renderAll();
}

init();
