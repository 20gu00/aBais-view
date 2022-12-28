<template>
    <a-button
      :type="customType"
      :class="customClass"
      :size="customSize"
      :disabled="disabled"
    >
      <template v-if="iconType" #icon>
        <component :is="iconType" />
      </template>
      <slot />
    </a-button>
  </template>
  <script>
  import { defineComponent, ref, watch } from 'vue'
  export default defineComponent({
    name: 'CButtonIndex',
    props: {
      type: { type: String, default: '' },
      size: { type: String, default: '' },
      icon: { type: String, default: '' },
      disabled: { type: Boolean, default: false },
      permission: { type: [String, Boolean], default: true }
    },
    setup (props) {
      const customClass = ref('c-button-primary')
      const customType = ref('')
      const customSize = ref('small')
      const iconType = ref('')
      watch(() => props.type, (v) => {
        switch (v) {
        case 'warning':
          customClass.value = 'c-button-warning'
          customType.value = 'default'
          break
        case 'error':
          customClass.value = 'c-button-error'
          customType.value = 'default'
          break
        case 'success':
          customClass.value = 'c-button-success'
          customType.value = 'default'
          break
        case 'primary':
          customClass.value = 'c-button-primary'
          customType.value = 'primary'
          break
        case 'cyan':
          customClass.value = 'c-button-cyan'
          customType.value = 'default'
          break
        case 'black':
          customClass.value = 'c-button-black'
          customType.value = 'default'
          break
        case 'purple':
          customClass.value = 'c-button-purple'
          customType.value = 'default'
          break
        case 'text':
          customClass.value = ''
          customType.value = 'text'
          break
        case 'link':
          customClass.value = ''
          customType.value = 'link'
          break
        default:
          customClass.value = ''
          customType.value = 'default'
          break
        }
      }, { immediate: true })
      watch(() => props.size, v => {
        customSize.value = !v ? 'small' : v
      }, { immediate: true })
      watch(() => props.icon, v => {
        iconType.value = v
      }, { immediate: true })
      watch(() => props, () => {}, { immediate: true })
      return {
        customClass,
        customType,
        customSize,
        iconType
      }
    }
  })
  </script>
  <style scoped>
  .c-button-primary {
    color: #3991e3;
    background-color: #3991e33a;
    border-color: #3991e3;
  }
  .c-button-primary:hover {
    color: #fff;
    background-color: #3991e389;
    border-color: #3991e389;
  }
  .c-button-primary[disabled], .c-button-primary[disabled]:hover, .c-button-primary[disabled]:focus, .c-button-primary[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  
  .c-button-warning {
    color: #10c376;
    background-color: #12bce225;
    border-color: #10c376;
  }
  .c-button-warning:hover {
    color: #fff;
    background-color: #10c37576;
    border-color: #10c37576;
  }
  .c-button-warning[disabled], .c-button-warning[disabled]:hover, .c-button-warning[disabled]:focus, .c-button-warning[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  
  .c-button-error {
    color: #a3a2a3;
    background-color: #84808238;
    border-color: #a3a2a3;
  }
  .c-button-error:hover {
    color: #fff;
    background-color: #8480826d;
    border-color: #8480826d;
  }
  .c-button-error[disabled], .c-button-error[disabled]:hover, .c-button-error[disabled]:focus, .c-button-error[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  
  .c-button-success {
    color: #fff;
    background-color: #00cc66;
    border-color: #00cc66;
  }
  .c-button-success:hover {
    color: #fff;
    background-color: #03e071;
    border-color: #00cc66;
  }
  .c-button-success[disabled], .c-button-success[disabled]:hover, .c-button-success[disabled]:focus, .c-button-success[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  
  .c-button-cyan {
    color: #fff;
    background-color: #04c1e1;
    border-color: #04c1e1;
  }
  .c-button-cyan:hover {
    color: #fff;
    background-color: #0ad5f8;
    border-color: #04c1e1;
  }
  .c-button-cyan[disabled], .c-button-cyan[disabled]:hover, .c-button-cyan[disabled]:focus, .c-button-cyan[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  
  .c-button-black {
    color: #fff;
    background-color: #131313;
    border-color: #131313;
  }
  .c-button-black:hover {
    color: #fff;
    background-color: #313131;
    border-color: #131313;
  }
  .c-button-black[disabled], .c-button-black[disabled]:hover, .c-button-black[disabled]:focus, .c-button-black[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  
  .c-button-purple {
    color: #c34bf2;
    background-color: #c589dd54;
    border-color: #c34bf2;
  }
  .c-button-purple:hover {
    color: #fff;
    background-color: #c951fa;
    border-color: #B500FE;
  }
  .c-button-purple[disabled], .c-button-purple[disabled]:hover, .c-button-purple[disabled]:focus, .c-button-purple[disabled]:active {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    text-shadow: none;
    box-shadow: none;
  }
  .ant-btn {
        border-radius: 1px;
    }
  </style>