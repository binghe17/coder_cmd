
const AsyncFun = require('./AsyncFun')

process.on('message', function(msg){//监听主进程发来的消息

	AsyncFun.data.process = process;
	AsyncFun.data.msg = msg;
	AsyncFun.data.execFun2 = execFun2;

	AsyncFun.run(function(){
		new Promise(function(resolve, reject) {
			console.log('=============运行了子进程')
			const proc =  require('child_process').exec;

			var execFun2 = AsyncFun.data.execFun2;
			var process = AsyncFun.data.process;
			var msg = AsyncFun.data.msg;

			cmd =  proc(msg, { encoding: 'binary' }); //proc.exec只在本线程中执行

			try{
				process.send({status: 'ok',data:'<b>['+(new Date()).toLocaleString()+'] > '+ msg+'</b>\n'});
				execFun2(cmd, function(rs){//接收从cmd中传来的数据
						// console.log(rs);
						process.send({status:'ok', data: rs});//给主进程发送消息。
				}, function(rs){//与cmd的通信出错时
						process.send({status:'error', data: rs})
						resolve()
				}, function(rs){//断开与cmd的通信时
						process.send({status:'close', data: rs})
						resolve()

				});
			}catch(err){
				process.send({status:'catch', data: err.message})
				resolve()
			}

		})
	});

});



function execFun2(cmd,callback,callback2,callback3){
	// console.log('============运行了execFun2')
	if(callback!= null){
			cmd.stdout.on('data', function(data) {
			var data = binary2utf8(data);
			callback(data);
		});
	}
	if(callback2!= null){
		cmd.stderr.on('data', function(data) {
			var data = binary2utf8(data);
			callback2(data);
		});
	}
	if(callback3!= null){
		cmd.on('close', function(code) {
			callback3(code);
		});
	}
}


		function binary2utf8(msg){
			var iconv = require('iconv-lite');
			var encoding = 'utf8';//cp936
			var binaryEncoding = 'binary';
			return  iconv.decode( Buffer.from(msg, binaryEncoding), encoding);
		}
