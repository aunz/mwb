'use strict'

const log = console.log.bind(console)

function cat1(){
	log('\x1b[30;1m')
	log('Courtesy https://user.xmission.com/~emailbox/ascii_cats.htm')
	log('\x1b[0m')
	log()
	log('           *     ,MMM8&&&.            *')
	log('                MMMM88&&&&&    .')
	log('               MMMM88&&&&&&&')
	log('   *           MMM88&&&&&&&&')
	log('               MMM88&&&&&&&&')
	log('               \'MMM88&&&&&&\'')
	log('                 \'MMM8&&&\'      *')
	log('        |\\___/|')
	log('        )     (             .              ')
	log('       =\\     /=')
	log('         )===(       *')
	log('        /     \\')
	log('        |     |')
	log('       /       \\')
	log('       \\       /')
	log('_/\\_/\\_/\\__  _/_/\\_/\\_/\\_/\\_/\\_/\\_/\\_/\\_/\\_')
	log('|  |  |  |( (  |  |  |  |  |  |  |  |  |  |')
	log('|  |  |  | ) ) |  |  |  |  |  |  |  |  |  |')
	log('|  |  |  |(_(  |  |  |  |  |  |  |  |  |  |')
	log('|  |  |  |  |  |  |  |  |  |  |  |  |  |  |')
	log('|  |  |  |  |  |  |  |  |  |  |  |  |  |  |')
	log()
}


module.exports = {
	cat1
}