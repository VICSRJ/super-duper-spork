(()=>{
  'use strict';
  const dialog=document.getElementById('actionDialog');
  if(!dialog)return;
  dialog.classList.add('glass-modal');

  const sync=()=>{
    document.documentElement.classList.toggle('modal-open',dialog.open);
    dialog.classList.toggle('is-open',dialog.open);
  };
  new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']});

  dialog.addEventListener('click',e=>{
    if(e.target===dialog)dialog.close();
  });

  dialog.addEventListener('cancel',()=>{
    dialog.close();
  });

  dialog.addEventListener('close',sync);
  sync();
})();
