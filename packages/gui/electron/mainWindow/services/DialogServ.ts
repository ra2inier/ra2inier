import { BrowserWindow, dialog, shell } from 'electron';
import path, { resolve } from 'node:path';
import { controller, mapping, param, pathVar, inject } from '~/mainWindow/ioc.config';

const TYPE_MAP: Record<string, any[]> = {
   dir: ['openDirectory'],
   dirs: ['openDirectory', 'multiSelections'],
   files: ['openFile', 'multiSelections'],
   file: ['openFile']
}

@controller('dialog')
export class DialogServ {

   @inject('window') declare window: BrowserWindow


   @mapping('open')
   async openDialog(@pathVar type: string, @param('modal') isModal: boolean, @param('path') path: string) {
      const properties = TYPE_MAP[type] || TYPE_MAP.file
      let ret: Electron.OpenDialogReturnValue
      const option: any = { properties }
      path && (option.defaultPath = path)
      if (isModal) ret = await dialog.showOpenDialog(this.window, option)
      else ret = await dialog.showOpenDialog({ properties })
      if (ret.canceled) throw Error('用户取消了操作')
      else return ret.filePaths.map(p => p.replaceAll('\\', '/'))
   }

   @mapping('show')
   async openShowFileDialog(@param('path') path: string) {
      if (path) shell.showItemInFolder(resolve(path))
      return !!path
   }
}
