export const CLIENT_JS = `
(function(){
  var bundle = JSON.parse(document.getElementById('bundle').textContent);
  function get(path){ return path.split('.').reduce(function(o,k){ return o==null?undefined:o[/^\\d+$/.test(k)?Number(k):k]; }, bundle); }
  document.querySelectorAll('button.copy').forEach(function(btn){
    btn.addEventListener('click', function(){
      var v = btn.dataset.copyText != null ? btn.dataset.copyText : get(btn.dataset.copyPath);
      var text = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
      navigator.clipboard.writeText(text).then(function(){ var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = o; }, 1200); });
    });
  });
  document.querySelectorAll('[data-tabs]').forEach(function(group){
    var buttons = group.querySelectorAll('.tabs button');
    var panels = group.querySelectorAll('.panel');
    function activate(i){
      buttons.forEach(function(b,j){ b.setAttribute('aria-selected', String(i===j)); });
      panels.forEach(function(p,j){ if(i===j) p.setAttribute('data-active',''); else p.removeAttribute('data-active'); });
    }
    buttons.forEach(function(b,i){ b.addEventListener('click', function(){ activate(i); }); });
    activate(0);
  });
})();
`;
