import React from 'react'
import styleA from './animation.css'
import styleB from './fontello-embedded.css'

//React class
export class Home extends React.Component {	
	render() {
		return <div>
			<h1>Hello World</h1>
			<li>This app is bundled by <b>webpack</b></li>
			<li>The backend is powered by <b>express</b></li>
			<li>The view is rendered by <b>react</b></li>
			<li>Routing in the client is supported by <b>page</b>, in server by <b>express</b></li>
			<li>This app is also rendered in the server by <b>react</b> and <b>express</b></li>
			<li><b>Hot reloading</b> in <b>client</b> & <b>server</b> is enabled by webpack hot module replacement and hot middleware</li>
			<br /><a href="/">Home</a> <Spin store={this.props.store}/><br />
			<br /><a href="/about" >About</a> This is a sync action<br />
			<br /><a href="/about/async">About</a> This is a async action, take 3 seconds to load<br />
			<br /><a href="/post">Post</a> This is an async action, require database access<br />
			<br /><a href="/404">404</a> This will throw a 404 page. If you refresh the page, it will also give you the correct status code 404  <br />
			<br /><a href="/500">500</a> An error page example <br />			
		</div>	
	}
}

//using the redux store getstate, subsribe and react setState 
class Spin extends React.Component {
	constructor(props){
		super(props)		
		this.state = {spinning:this.props.store.getState().spinning}
	}
	componentDidMount() {
		const store = this.props.store
		this.unsubscribe = store.subscribe(()=>{			
			this.setState({spinning:store.getState().spinning})
		})
	}
	componentWillUnmount() {
		this.unsubscribe()
		this.subscribe = null		
	}
	render() {
		let spin = styleB['icon-spin4']
		spin += this.state.spinning ? ' ' + styleA['animate-spin'] : ''
		return <i className={spin}></i>
	}
}

//stateless function
export function About(props) {	
	return <div>
		About:
		Eat fruits & veges only, save the planet!
	</div>
}


export class Post extends React.Component {
	render() {		
		const id = this.props.store.getState().req.params.article
		
		if (!id) return <div>
			<h1>The main article page</h1>
		  <a href="/post/1">Article 1</a><br />
		  <a href="/post/2">Article 2</a><br />
		  <a href="/post/3">Article 3</a><br />
		  <a href="/post/4">Article 4</a> This will give a 404 page<br />
		  <a href="/post/5">Article 5</a> This will throw a 500 page<br />
		</div>
		
		const post = this.props.store.getState().post.find(p=>p.id == id)		
		return <div>
			<h3>ID: {post.id}</h3>
			<p>Author: <b>{post.author}</b></p>
			<p>Content: {post.content}</p>

		</div>
	}
}

export function NotFoundPage(props) {
	return <div>404 Can't find the things you are looking for at {props.req}</div>
}

export function ErrorPage(props) {
	return <div>500 Oops! {props.error}</div>
}
