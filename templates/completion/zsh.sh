#compdef proj
_proj() {
  local -a cmds projects favs editors workspaces tagids projkeys
  cmds=(${(f)"$(proj __complete commands 2>/dev/null)"})
  projects=(${(f)"$(proj __complete projects 2>/dev/null)"})
  favs=(${(f)"$(proj __complete fav-names 2>/dev/null)"})
  editors=(${(f)"$(proj __complete editors 2>/dev/null)"})
  workspaces=(${(f)"$(proj __complete workspaces 2>/dev/null)"})
  tagids=(${(f)"$(proj __complete tag-ids 2>/dev/null)"})
  projkeys=(${(f)"$(proj __complete projrc-keys 2>/dev/null)"})
  if (( CURRENT == 2 )); then
    compadd -a cmds
    return
  fi
  case $words[2] in
    ls)
      if (( CURRENT == 3 )); then
        compadd -- -f -o -t --json --grep -h --help
        compadd -a tagids
      elif (( CURRENT >= 4 )); then
        compadd -- -f -o -t --json --grep
        compadd -a tagids
      fi
      ;;
    dir)
      case $CURRENT in
        3)
          compadd -- -w -h --help
          compadd -a workspaces
          _path_files -/
          ;;
        4)
          if [[ $words[3] == -w ]]; then
            compadd -a workspaces
          else
            compadd -- -w
          fi
          ;;
        5)
          [[ $words[4] == -w ]] && compadd -a workspaces
          ;;
      esac
      ;;
    use)
      (( CURRENT == 3 )) && { compadd -- -h --help; compadd -a workspaces }
      ;;
    completion)
      (( CURRENT == 3 )) && compadd bash zsh fish powershell pwsh -h --help
      ;;
    editor)
      (( CURRENT == 3 )) && { compadd -- -h --help; compadd -a editors }
      ;;
    new)
      if (( CURRENT == 3 )); then
        compadd -- --dry-run --force -h --help
        _path_files -/
      elif (( CURRENT >= 4 )); then
        compadd -- --dry-run --force
        _path_files -/
      fi
      ;;
    clone)
      (( CURRENT == 3 )) && compadd -h --help
      ;;
    verify|tags)
      (( CURRENT == 3 )) && compadd -h --help
      ;;
    open)
      case $CURRENT in
        3) compadd -- -h --help; compadd -a projects ;;
        4) compadd -- -r --root --wt -p --project -h --help; compadd -a editors ;;
      esac
      ;;
    pwd)
      case $CURRENT in
        3) compadd -- -h --help; compadd -a projects ;;
        4) compadd -- -r --root --wt -p --project -h --help ;;
        *)
          (( CURRENT >= 5 )) && [[ $words[CURRENT-1] == --wt ]] && compadd main
          ;;
      esac
      ;;
    wt)
      case $CURRENT in
        3) compadd -- -h --help; compadd -a projects ;;
        5) compadd -- -b -h --help ;;
      esac
      ;;
    tag)
      case $CURRENT in
        3) compadd -- -d -p -h --help ;;
        4)
          if [[ $words[3] == -p ]]; then
            compadd -a projects
          elif [[ $words[3] == -d ]]; then
            compadd -- -p -h --help
            compadd -a tagids
          else
            compadd -- -d -p -h --help
            compadd -a tagids
          fi
          ;;
        5)
          [[ $words[4] == -p ]] && compadd -a projects
          ;;
      esac
      ;;
    status)
      (( CURRENT == 3 )) && { compadd -- --json -h --help; compadd -a projects }
      ;;
    rm)
      (( CURRENT == 3 )) && { compadd -- -f --force -h --help; compadd -a projects }
      ;;
    set)
      case $CURRENT in
        3) compadd -- -d -h --help; compadd -a projects ;;
        4)
          if [[ $words[3] == -d ]]; then
            compadd -a projects
          else
            compadd -a projkeys
          fi
          ;;
        5)
          if [[ $words[3] == -d ]]; then
            compadd -a projkeys
          elif [[ $words[4] == -d ]]; then
            compadd -a projkeys
          else
            compadd -- -d
          fi
          ;;
      esac
      ;;
    get)
      case $CURRENT in
        3) compadd -- -h --help; compadd -a projects ;;
        4) compadd -a projkeys ;;
      esac
      ;;
    mv)
      (( CURRENT == 3 || CURRENT == 4 )) && { compadd -- -h --help; compadd -a projects }
      ;;
    fav)
      if (( CURRENT == 3 )); then
        compadd -- -d -h --help
        compadd -a projects
      elif (( CURRENT == 4 )) && [[ $words[3] == -d ]]; then
        compadd -a favs
      fi
      ;;
  esac
}
compdef _proj proj
