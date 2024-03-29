"use module"
import tape from "tape"

import { Expect, NotExpectedError} from ".."

const abc123= [ 1, 2, 3, "a", "b", "c"]

tape( "gets what is expected", async function( t){
	t.plan( 13) // 6 elements twice, and done is checked too
	async function *generator(){
		yield* abc123
	}
	function equal( a, b){
		t.equal( a, b, "got expected element")
		return a=== b
	}
	const expecting= new Expect( generator(), abc123, equal)
	for await( const val of expecting){
		t.ok( val)
	}
	t.end()
})

tape( "error on something unexpected", async function( t){
	t.plan( 4)
	async function *generator(){
		yield 1
		yield 2
		yield -99
	}
	const expecting= new Expect( generator(), abc123)
	let err
	try{
		for await( const val of expecting){
			t.ok( val, "got good element")
		}
	}catch( ex){
		err= ex
	}
	t.ok( err instanceof NotExpectedError, "got expected an NotExpectedError")
	t.equal( err.code, NotExpectedError.NOT_EQUAL, "got expected NOT_EQUAL")
	t.end()
})

tape( ".then returns length of run", async function( t){
	t.plan( 1)
	async function *generator(){
		yield* abc123
	}
	const
	  expecting= new Expect( generator, abc123),
	  got= await expecting
	t.equal( got.count, 6, "count of 6 resolved")
	t.end()
})

tape( "multiple consumers trigger multiple iterations", async function( t){
	t.plan( 0)
	t.end()
})
