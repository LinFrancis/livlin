(async function(){
  const kmEl=document.getElementById('kmList')
  const resKM=await fetch('assets/data/keymessages.json')
  const km=await resKM.json()
  function renderKM(){
    const showES=document.getElementById('showES').checked
    const showEN=document.getElementById('showEN').checked
    const showZH=document.getElementById('showZH').checked
    const showPY=document.getElementById('showPY').checked
    kmEl.innerHTML=''
    km.forEach(k=>{
      const card=document.createElement('div')
      card.className='card'
      card.innerHTML='<h4>'+k.title+'</h4>'
        +(showES&&k.es?'<p><b>ES:</b> '+k.es+'</p>':'')
        +(showEN&&k.en?'<p><b>EN:</b> '+k.en+'</p>':'')
        +(showZH&&k.zh?'<p><b>中:</b> '+k.zh+'</p>':'')
        +(showPY&&k.py?'<p><b>Pinyin:</b> '+k.py+'</p>':'')
      kmEl.appendChild(card)
    })
  }
  ;['showES','showEN','showZH','showPY'].forEach(id=>{
    document.getElementById(id).addEventListener('change',renderKM)
  })
  renderKM()
  const resDict=await fetch('assets/data/dictionary.json')
  const words=await resDict.json()
  const list=document.getElementById('dictList')
  const count=document.getElementById('dictCount')
  const q=document.getElementById('q')
  const pyToggle=document.getElementById('pyToggle')
  function renderDict(){
    const query=(q.value||'').toLowerCase()
    list.innerHTML=''
    const filtered=words.filter(w=>!query||w.characters.toLowerCase().includes(query)||(w.pinyin||'').toLowerCase().includes(query)||(w.meaning||'').toLowerCase().includes(query))
    count.textContent='Resultados: '+filtered.length
    filtered.forEach(w=>{
      const card=document.createElement('div')
      card.className='card'
      card.innerHTML='<div style="font-size:22px">'+w.characters+'</div>'
        +(pyToggle.checked&&w.pinyin?'<div><i>'+w.pinyin+'</i></div>':'')
        +(w.meaning?'<div>'+w.meaning+'</div>':'')
      list.appendChild(card)
    })
  }
  q.addEventListener('input',renderDict)
  pyToggle.addEventListener('change',renderDict)
  renderDict()
})();