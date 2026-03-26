#compdef proj
_proj() {
  local -a cmds projects favs
  cmds=(${(f)"$(proj __complete commands 2>/dev/null)"})
  projects=(${(f)"$(proj __complete projects 2>/dev/null)"})
  favs=(${(f)"$(proj __complete fav-names 2>/dev/null)"})
  if (( CURRENT == 2 )); then
    compadd -a cmds
    return
  fi
  case $words[2] in
    open|status|pwd|rm)
      (( CURRENT == 3 )) && compadd -a projects
      ;;
    set)
      case $CURRENT in
        3) compadd -a projects ;;
        4) compadd name owner created tracker ;;
      esac
      ;;
    get)
      case $CURRENT in
        3) compadd -a projects ;;
        4) compadd name owner created ;;
      esac
      ;;
    mv)
      (( CURRENT == 3 || CURRENT == 4 )) && compadd -a projects
      ;;
    fav)
      if (( CURRENT == 3 )); then
        compadd -- -d
        compadd -a projects
      elif (( CURRENT == 4 )) && [[ $words[3] == -d ]]; then
        compadd -a favs
      fi
      ;;
  esac
}
compdef _proj proj
