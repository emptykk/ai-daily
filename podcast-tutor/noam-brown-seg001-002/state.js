(function(root){
'use strict';
function locate(data,time){return data.playlist.find(p=>time>=p.course_start&&time<p.course_end)||data.playlist[data.playlist.length-1];}
function snapshot(data,time,rate,mode){const p=locate(data,time);return {item_id:p.id,item_offset_sec:Math.max(0,time-p.course_start),segment_id:p.segment_id,lesson_version:data.lessons[p.segment_id].version,playlist_revision:data.playlist_revision,lesson_mode:mode,playback_rate:rate,course_position_sec:time};}
function resumeTime(data,s){if(s.playlist_revision!==data.playlist_revision)throw Error('课程版本已变化，请重新选择位置。');const p=data.playlist.find(x=>x.id===s.item_id);if(!p)throw Error('原播放项已不存在。');return p.course_start+Math.min(p.duration_sec,Math.max(0,s.item_offset_sec));}
const api={locate,snapshot,resumeTime};if(typeof module!=='undefined')module.exports=api;else root.TutorState=api;
})(typeof window==='undefined'?globalThis:window);
