/* Browser-only vector PDF layout. No network requests or persistence. */
window.FishingPDF = (() => {
  const INK = [36, 41, 35], TAN = [227, 218, 201];
  const sections = [
    ['Trip', ['date','location','area','start','end','partners','water_type']],
    ['Conditions', ['weather','air_temp','water_temp','flow','clarity','wind','wind_speed']],
    ['Equipment', ['rod','reel','line','leader','tippet','methods']],
    ['Catch Summary', ['total','species','largest','length','best_time','best_fly','best_water']]
  ];
  const labels = {date:'Date',location:'Location',area:'Specific Area / Access Point',start:'Start Time',end:'End Time',partners:'Fishing Partners',water_type:'Water Type',weather:'Weather',air_temp:'Air Temperature (°F)',water_temp:'Water Temperature (°F)',flow:'Water Level / Flow (CFS)',clarity:'Water Clarity',wind:'Wind',wind_speed:'Wind Speed (mph)',rod:'Rod',reel:'Reel',line:'Fly Line',leader:'Leader',tippet:'Tippet',methods:'Fishing Method',total:'Total Fish Caught',species:'Species',largest:'Largest Fish',length:'Approximate Length (inches)',best_time:'Best Time',best_fly:'Best Fly',best_water:'Best Water Type'};
  const notes = [['worked','What Worked'],['didnt',"What Didn't Work"],['observations','Observations'],['next','Next Time']];
  // Standard PDF fonts use Windows Latin characters. Normalize common punctuation.
  function clean(value) {
    return String(value || '').trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/…/g,'...');
  }
  function readForm(form) {
    if (!form.reportValidity()) throw new Error('Enter a valid date and location.');
    const values = new FormData(form), data = {};
    for (const [,keys] of sections) for (const key of keys) {
      if (key === 'methods') continue;
      data[key] = clean(values.get(key));
      if (data[key].length > 200) throw new Error(`${labels[key]} exceeds 200 characters.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !data.location) throw new Error('Date and location are required.');
    const parsed = new Date(data.date + 'T12:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== data.date) throw new Error('Enter a valid date.');
    data.methods = values.getAll('methods').join(', ');
    for (const [key] of notes) {
      data[key] = clean(values.get(key));
      if (data[key].length > 12000) throw new Error('Notes must be 12,000 characters or fewer.');
    }
    data.rating = clean(values.get('rating'));
    data.flies = [...form.querySelectorAll('#fly-rows tr')].map(row => [...row.querySelectorAll('input')].map(input => clean(input.value))).filter(row => row.some(Boolean));
    if (data.flies.length > 50 || data.flies.some(row => row.some(value => value.length > 200))) throw new Error('Use up to 50 flies with 200 characters per field.');
    return data;
  }
  function filename(date, location) {
    const slug = String(location).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80) || 'location';
    return `fly-fishing-log_${date}_${slug}.pdf`;
  }
  function generate(data) {
    const doc = new window.jspdf.jsPDF({unit:'pt',format:'letter',orientation:'portrait',compress:true});
    doc.setProperties({title:'Fly Fishing Log',author:'Fly Fishing Log'});
    const margin = 43, width = 526, top = 42, bottom = 749;
    // Layout uses exactly the same wrapping and measurements for both passes.
    function layout(scale, draw) {
      let y = top;
      function block(value, x, maxWidth, size=9, bold=false, at=y, render=draw) {
        doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(size*scale);
        const lines = doc.splitTextToSize(clean(value),maxWidth - 5);
        const leading = size*scale*1.44;
        if (render) { doc.setTextColor(...INK); doc.text(lines,x,at+size*scale,{lineHeightFactor:1.44}); }
        return lines.length * leading;
      }
      function heading(title) {
        y += 10*scale;
        y += block(title.toUpperCase(),margin,width,10,true);
        y += 5*scale;
      }
      y += block('FLY FISHING LOG',margin,width,25,true);
      y += block('Record the water. Remember the day.',margin,width);
      y += 12*scale;
      y += block(data.location,margin,width,15,true);
      y += block(new Date(data.date+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}),margin,width);
      function table(rows, widths, header=false) {
        for (let r=0;r<rows.length;r++) {
          const row = rows[r]; let x=margin;
          const pad = 4*scale;
          const heights = row.map((value,i)=>block(value,x,widths[i]-12,header&&r===0?8:9,header&&r===0,y+pad,false));
          const rowHeight = Math.max(...heights)+pad*2;
          if(draw && header && r===0) {doc.setFillColor(...TAN);doc.rect(margin,y,width,rowHeight,'F');}
          for(let i=0;i<row.length;i++) {
            block(row[i],x+6,widths[i]-12,header&&r===0?8:9,header&&r===0,y+pad);
            x+=widths[i];
          }
          y+=rowHeight;
          if(draw) {doc.setDrawColor(183,180,170);doc.setLineWidth(.3);doc.line(margin,y,margin+width,y);}
        }
      }
      for(const [title,keys] of sections) {
        if(title==='Catch Summary') {
          heading('Flies & Rigs');
          if(data.flies.length) table([['Fly','Size','Color','Rig / Position','Result'],...data.flies],[156,44,100,116,110],true);
          else y+=block('No flies recorded.',margin,width);
        }
        heading(title);
        const populated=keys.filter(key=>data[key]);
        if(!populated.length) {y+=block('-',margin,width);continue;}
        for(let i=0;i<populated.length;i+=2) {
          let rowHeight=0;
          for(let j=0;j<2 && i+j<populated.length;j++) {
            const key=populated[i+j],x=margin+j*263;
            rowHeight=Math.max(rowHeight,block(labels[key]+':',x,89,8,true),block(data[key],x+98,156));
          }
          y+=rowHeight+4*scale;
        }
      }
      for(const [key,title] of notes) if(data[key]) {heading(title);y+=block(data[key],margin,width);}
      heading('Trip Rating');y+=block(data.rating?`${data.rating} / 10`:'Unrated',margin,width);
      return y;
    }
    let scale=1;
    if(layout(scale,false)>bottom) {
      let low=.001,high=1;
      for(let i=0;i<18;i++) {const mid=(low+high)/2;if(layout(mid,false)<=bottom)low=mid;else high=mid;}
      scale=low;
    }
    layout(scale,true);
    doc.setDrawColor(183,180,170);doc.setLineWidth(.4);doc.line(margin,760,569,760);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...INK);
    doc.text('FLY FISHING LOG  /  FIELD RECORD',margin,772);doc.text('Page 1',569,772,{align:'right'});
    return doc;
  }
  return {readForm,filename,generate};
})();
