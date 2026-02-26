import './styles.scss'
import { App } from './app'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('App root (#app) not found')
}

const app = new App(root)
app.start()
