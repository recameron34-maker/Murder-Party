// Word list for guest passphrases (three words, e.g. "velvet-raven-candle").
// 256 words → 16.7 million combinations; logins are also rate-limited.
export const WORDS = (
  'abbey absinthe alabaster amber anchor antler arsenic ash attic autumn ' +
  'ballroom banquet baron bat belfry bell birch bishop blackbird blade bloom bone ' +
  'bonfire bramble brandy brass brocade bronze butler cameo canal candle canopy cape ' +
  'carriage cask cellar chalice chapel charcoal cherry chess chimney cinder cipher claret ' +
  'clock cloister cobweb coffin cognac comet coronet corset countess crimson crow crown ' +
  'crypt crystal curtain dagger dahlia damask dance dawn decanter dove dowager drawbridge ' +
  'duchess dusk ebony echo eclipse ember emerald ermine falcon feather fern fiddle ' +
  'firefly flint fog folly fountain fox frost gable garnet gargoyle garter gilt glove ' +
  'goblet gold gondola gossamer granite grape gravel grove harp hawthorn heather heir ' +
  'hemlock heron hollow holly honey hound hourglass ink iris ivory ivy jasmine jet ' +
  'jewel juniper key lace lagoon lamp lantern larder laurel lavender ledger lily linen ' +
  'locket lute magpie mantel manor maple marble marquess mask meadow medal midnight ' +
  'mink mirror mist monocle moon moss moth nettle nightjar oak obsidian onyx opal ' +
  'opera orchard orchid organ owl oyster paisley palace parlour pearl pewter pheasant ' +
  'piano pine plum poison poplar portrait potion quill raven regent ribbon riddle ' +
  'river rook rose ruby rue sable saffron sapphire satin scarlet sceptre secret serpent ' +
  'shadow shroud silk silver slipper snow sonnet sorrel spade spire stag starling ' +
  'storm sugar swan sword taper tapestry tarot thistle thorn thunder tiara tide tower ' +
  'trellis tulip turret twilight umber valley vault velvet venom vesper vicar vine ' +
  'violet viper waltz wax willow wine winter wisteria wolf wren yew'
).split(/\s+/).filter(Boolean);
