(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SchoolUpdateRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function assetUrl(path,href,manifest,refresh){
    const url=new URL(path,href);if(!['http:','https:'].includes(url.protocol)||url.origin!==new URL(href).origin)return path;
    // Only modified assets receive a new URL; audio and unchanged art keep their cache.
    url.searchParams.set('v',manifest.assets?.[path]||manifest.version);
    if(refresh)url.searchParams.set('_refresh',refresh);return url.href;
  }
  function freshUrl(href,version){const url=new URL(href);url.searchParams.delete('_refresh');url.searchParams.set('_build',version);return url.href;}
  function htmlVersion(html){return /<html\b[^>]*\bdata-version\s*=\s*["']([^"']+)["']/i.exec(html)?.[1]||null;}
  function validManifest(value){return !!value&&typeof value.version==='string'&&/^[a-zA-Z0-9._-]{1,96}$/.test(value.version)&&!!value.assets&&typeof value.assets==='object'&&!Array.isArray(value.assets);}
  return {assetUrl,freshUrl,htmlVersion,validManifest};
});
