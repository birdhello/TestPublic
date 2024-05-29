
const render = async () => {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('webgpu');
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
      device,
      format: canvasFormat,
    });
  
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: { r: 0.6, g: 0.8, b: 0.9, a: 1 },
          storeOp: 'store',
        },
      ],
    });
  
    // 创建顶点数据
    // prettier-ignore
    const vertices = new Float32Array([
      -0.5, -0.5,
      0.5, -0.5,
      0.5, 0.5,
    ]);
    // 缓冲区
    const vertexBuffer = device.createBuffer({
      // 标识，字符串随意写，报错时会通过它定位，
      label: 'Triangle Vertices',
      // 缓冲区大小，这里是 24 字节。6 个 4 字节（即 32 位）的浮点数
      size: vertices.byteLength,
      // 标识缓冲区用途（1）用于顶点着色器（2）可以从 CPU 复制数据到缓冲区
      // eslint-disable-next-line no-undef
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // 将顶点数据复制到缓冲区
    device.queue.writeBuffer(vertexBuffer, /* bufferOffset */ 0, vertices);
  
    // GPU 应该如何读取缓冲区中的数据
    const vertexBufferLayout = {
      arrayStride: 2 * 4, // 每一组的字节数，每组有两个数字（2 * 4字节）
      attributes: [
        {
          format: 'float32x2', // 每个数字是32位浮点数
          offset: 0, // 从每组的第一个数字开始
          shaderLocation: 0, // 顶点着色器中的位置
        },
      ],
    };
  
    // 着色器用的是 WGSL 着色器语言
    const vertexShaderModule = device.createShaderModule({
      label: 'Vertex Shader',
      code: `
        @vertex
        fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
          return vec4f(pos, 0, 1);
        }
  
        @fragment
        fn fragmentMain() -> @location(0) vec4f {
          return vec4f(1, 0, 0, 1);
        }
      `,
    });
  
    // 渲染流水线
    const pipeline = device.createRenderPipeline({
      label: 'pipeline',
      layout: 'auto',
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: vertexShaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: canvasFormat,
          },
        ],
      },
    });
  
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2);
  
    pass.end();
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  };
  
  
  render();