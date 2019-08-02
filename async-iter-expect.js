"use module"

import PImmediate from "p-immediate"

/**
* NotExpectedError thrown if results not as expected
*/
export class NotExpectedError extends Error{
	// codes
	static get NOT_EQUAL(){ return 1}
	static get CHECKED_TERMINATED(){ return 2}
	static get EXPECTED_TERMINATED(){ return 3}

	constructor( msg, code){
		super( msg)
		this.code= code
	}
}

/**
* Reference check to see if objects match
*/
export function equality( a, b){
	return a=== b
}

function getIterator( o){
	if( !o){
		throw new Error("No object to get iterator from")
	}
	if( o[ Symbol.asyncIterator]){
		return o[ Symbol.asyncIterator]()
	}
	if( o[ Symbol.iterator]){
		return o[ Symbol.iterator]()
	}
	if( o instanceof Function){
		return getIterator( o())
	}
	throw new Error("Could not find iterator")
}

async function next(){
	const
	  // request both
	  valPromise= this.checked.next(),
	  expPromise= this.expected.next(),
	  // resolve each
	  val= await valPromise,
	  exp= await expPromise

	let err
	// check equality
	if( !this.equalityCheck( val.value, exp.value)){
		err= new NotExpectedError( "Unexpected value", NotExpectedError.NOT_EQUAL)
	}
	// check for one stream terminating early
	// higher priority, will override previous code
	if( exp.done&& !val.done){
		err= new NotExpectedError( "Expected terminated early", NotExpectedError.EXPECTED_TERMINATED)
	}
	if( val.done&& !exp.done){
		err= new NotExpectedError( "Checked terminated early", NotExpectedError.CHECKED_TERMINATED)
	}
	if( err){
		err.value= val.value
		err.expected= exp.value
		throw err
	}

	// looks good
	if( val.done&& exp.done){
		return val
	}
	++this.count
	return val
}

export class Expect{
	constructor( checked, expected, equalityCheck= equality){
		this.checked= checked
		this.expected= expected
		this.equalityCheck= equalityCheck
	}
	[ Symbol.asyncIterator](){
		let iterator= {
			next: null,
			count: 0,
			checked: getIterator( this.checked),
			expected: getIterator( this.expected),
			equalityCheck: this.equalityCheck
		}
		iterator.next= next.bind( iterator)
		return iterator
	}
	async then( ok, fail){
		try{
			await PImmediate() // give other iteratees a chance first
			const iterator= this[ Symbol.asyncIterator]()
			while( true){
				const val= await iterator.next()
				if( val.done){
					break
				}
			}
			return ok( iterator)
		}catch( ex){
			return fail( ex)
		}
	}
}

export {
	Expect as expect,
	Expect as default,
	Expect as AsyncIterExpect,
	Expect as asyncIterExpect
}
