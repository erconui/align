import * as migration1 from './1_initial';
import * as migration2 from './2_add_recurrenc_rules';
import * as migration3 from './3_private_lists';

export const migrations = [
  migration1,
  migration2,
  migration3
];
