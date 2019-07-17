"use module"

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
	return o[ Symbol.asyncIterator]? o[ Symbol.asyncIterator](): o[ Symbol.iterator]()
}



export async function *Expect( checked, expected, equalityCheck= equality){
	const
	  checkedIter= getIterator( checked),
	  expectedIter= getIterator( expected)
	while( true){
		const
		  // request both
		  valPromise= checkedIter.next(),
		  expPromise= expectedIter.next(),
		  // resolve each
		  val= await valPromise,
		  exp= await expPromise

		let err
		// check equality
		if( !equalityCheck( val.value, exp.value)){
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

		if( val.done&& exp.done){
			return val.value
		}
		yield val.value
	}
}
export {
	Expect as expect,
	Expect as default,
	Expect as AsyncIterExpect,
	Expect as asyncIterExpect
}
