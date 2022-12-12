
export function filesSizeTransform(bytes = 0, decimals = 1, maxscale = 3, minscale = 1, mindecimals = 1, padStart = 5) {
  const k = 1024,
    sizes = ['b', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    scale = Math.min(maxscale, Math.max(minscale, Math.floor(Math.log(bytes) / Math.log(k))));
  if(scale < mindecimals){
    decimals = 0
  }
  let displaySize = bytes ? Math.max(1,(bytes / Math.pow(k, scale))):0
  displaySize = displaySize.toFixed(decimals)
  displaySize = displaySize.replace(node, '$1 ')
  displaySize = displaySize.padStart(padStart, " ")
  return displaySize + '' + sizes[scale];
}


export async function sync(s1, s2){
  console.log("initializing")
  let tasks = await this._synqTasks(s1, s2)
  let total = tasks.create.reduce((prev,curr)=> prev + curr.size || 0,0)
  let totalReaded = 0
  let kbTotal = filesSizeTransform(total)

  console.log("removing files")
  for(let index =0; index < tasks.remove.length; index++){
    let task = tasks.remove[index]
    process.stdout.write(`\rRemoving (${index+1}/${tasks.remove.length}): ${task.path}`)
    await s2.delete(task.path)
  }
  console.log("")

  console.log("creating folders")
  for(let index =0; index < tasks.folder.length; index++){
    let task = tasks.folder[index]
    process.stdout.write(`\rCreating folder (${index+1}/${tasks.folder.length}): ${task.path}`)
    await s2.folder(task.path)
  }
  console.log("")

  console.log("copying files")
  for(let index =0; index < tasks.create.length; index++){
    let task = tasks.create[index]
    let kbFileSize = filesSizeTransform(task.size )
    let filename = task.path.substring(task.path.lastIndexOf("/") + 1)
    let readstream = await s1.read(task.path)
    await s2.write(task.path,readstream,({read})=>{
      let kbRead = filesSizeTransform(read)
      let percent = ('' + Math.floor((read / task.size) * 100)).padStart(3, " ")
      let totalReadedCurrent = filesSizeTransform(totalReaded + read)
      let fileProgress = `${kbRead}/${kbFileSize}`
      let totalProgress = `${totalReadedCurrent}/${kbTotal}`
      process.stdout.write(`\rUploading (${index+1}/${tasks.create.length}):${fileProgress} (${percent}%) (Total:${totalProgress}) file: ${task.path}`)
    })
    totalReaded += task.size
  }
  console.log("")
}

async function _synqTasks(system1, system2, folder = '/', tasks = {create: [], remove: [], folder: []}){
  let list1 = await system1.list(folder)
  let list2 = system2 && (await system2.list(folder))
  for(let file1 of list1){
    let file2 = system2 && list2.find(item => item.name === file1.name)
    file2 && list2.splice(list2.indexOf(file2),1)

    if(file1.size === undefined){
      if(!file2){
        tasks.folder.push({path: folder.substring(1) + file1.name})
      }
      await _synqTasks(system1, file2 && system2, folder + file1.name + '/', tasks)
    }
    else{
      if(!file2 || (file1.hash !== '' && file2.hash !== '' && file2.hash !== file1.hash)){
        tasks.create.push({path: folder.substring(1) + file1.name,size: file1.size})
      }
    }
  }
  if(list2?.length){
    for(let file2 of list2){
      tasks.remove.push({path: folder.substring(1) + file2.name})
    }
  }
  return tasks
}
