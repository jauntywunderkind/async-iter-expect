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

export class Expect extends Promise{
	constructor( checked, expected, equalityCheck= equality){
		let res, rej
		super( function( _res, _rej){
			res= _res
			rej= _rej
		})
		this.resolve= res
		this.reject= rej

		// input state
		this.checked= checked
		this.expected= expected
		this.equalityCheck= equalityCheck

		// synthesized state
		this.thenning= false
		this.checkedIter= null
		this.expectedIter= null
		this.count= -1
	}
	static get [Symbol.species](){
		return Promise
	}
	async *[ Symbol.asyncIterator](){
		if( this.count=== -1){
			this.count= 0
			this.checkedIter= getIterator( this.checked)
			this.expectedIter= getIterator( this.expected)
		}
		while( true){
			const
			  // request both
			  valPromise= this.checkedIter.next(),
			  expPromise= this.expectedIter.next(),
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
				if( !this.thenning){
					// no one has treated us like a promise so far
					// so do not create an unhandledRejection error
					super.then.call( this, null, function(){})
				}
				this.reject( err)
				throw err
			}

			// looks good	
			if( val.done&& exp.done){
				this.resolve({ count: this.count})
				return val.value
			}
			++this.count
			yield val.value
		}
	}
	async then( ok, fail){
		this.thenning= true
		await PImmediate() // give other iteratees a chance first
		for await( let o of this){
		}
		super.then.call( this, ok, fail)
	}
}

export {
	Expect as expect,
	Expect as default,
	Expect as AsyncIterExpect,
	Expect as asyncIterExpect
}
