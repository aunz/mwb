import {expect} from 'chai'

import f from '../kaka.js'

describe('Hello', () => {
  
	it('should time  2', () => {
		
		expect(f(2)).to.equal(20)
		// expect(0).to.not.be.false;
	});

});